import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getDelayMs, recordFailure, recordSuccess } from '@/lib/security/loginThrottle';
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Institutional Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const normalizedEmail = email.toLowerCase().trim();
        const delayMs = getDelayMs(normalizedEmail);

        if (delayMs > 0) {
          // Await exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const staff = await prisma.staff.findUnique({
          where: { institutionalEmail: normalizedEmail },
        });

        if (!staff) {
          recordFailure(normalizedEmail);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { staffId: staff.id },
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          recordFailure(normalizedEmail);
          return null;
        }

        recordSuccess(normalizedEmail);

        return {
          id: user.id, // NextAuth expects "id" conventionally
          userId: user.id,
          staffId: staff.id,
          isSuperAdmin: user.isSuperAdmin,
          email: staff.institutionalEmail,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.userId;
        token.staffId = user.staffId;
        token.isSuperAdmin = user.isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.userId = token.userId;
        session.user.staffId = token.staffId;
        session.user.isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);
