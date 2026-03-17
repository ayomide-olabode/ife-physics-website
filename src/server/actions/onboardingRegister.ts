'use server';

import bcrypt from 'bcrypt';
import { EmailTokenType } from '@prisma/client';
import { z } from 'zod';
import { buildInviteEmail } from '@/lib/emailTemplates';
import { sendMail } from '@/lib/mailer';
import prisma from '@/lib/prisma';
import {
  canResend,
  generateRawToken,
  getExpiresAt,
  getExpiryMinutes,
  hashToken,
  minutesUntilResend,
} from '@/lib/tokens';

const requestSchema = z.string().email();
type RegistrationRequestStatus = 'SENT' | 'THROTTLED' | 'ALREADY_ACTIVE' | 'NO_STAFF';

type RequestRegistrationResult =
  | {
      success: true;
      status: RegistrationRequestStatus;
      minutesRemaining?: number;
    }
  | {
      success: false;
      error: string;
    };

const completeSchema = z
  .object({
    tokenRaw: z.string().min(1, 'Invalid registration link.'),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string().min(8, 'Confirm password is required.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

function getAppUrl(): string {
  const baseUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  return baseUrl.replace(/\/+$/, '');
}

export async function requestRegistrationLink(email: string): Promise<RequestRegistrationResult> {
  const parsed = requestSchema.safeParse(email.trim().toLowerCase());
  if (!parsed.success) {
    return { success: false, error: 'Please enter a valid institutional email address.' };
  }

  const normalizedEmail = parsed.data;

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        institutionalEmail: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (!staff) {
      return { success: true, status: 'NO_STAFF' };
    }

    let user = await prisma.user.findUnique({
      where: { staffId: staff.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          staffId: staff.id,
          passwordHash: '',
          isSuperAdmin: false,
        },
      });
    }

    if (user.passwordHash !== '') {
      return { success: true, status: 'ALREADY_ACTIVE' };
    }

    const latestUnusedInvite = await prisma.emailToken.findFirst({
      where: {
        type: EmailTokenType.INVITE,
        email: normalizedEmail,
        usedAt: null,
      },
      select: {
        lastSentAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (latestUnusedInvite?.lastSentAt && !canResend(latestUnusedInvite.lastSentAt)) {
      return {
        success: true,
        status: 'THROTTLED',
        minutesRemaining: minutesUntilResend(latestUnusedInvite.lastSentAt),
      };
    }

    const rawToken = generateRawToken();
    const tokenType = EmailTokenType.INVITE;
    const expiresMinutes = getExpiryMinutes(tokenType);

    await prisma.emailToken.create({
      data: {
        type: tokenType,
        email: normalizedEmail,
        userId: user.id,
        staffId: staff.id,
        tokenHash: hashToken(rawToken),
        expiresAt: getExpiresAt(tokenType),
        usedAt: null,
        lastSentAt: new Date(),
      },
    });

    const link = `${getAppUrl()}/register/confirm?token=${rawToken}`;
    const template = buildInviteEmail({ link, expiresMinutes });

    await sendMail({
      to: normalizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    return { success: true, status: 'SENT' };
  } catch (error) {
    console.error('requestRegistrationLink error:', error);
    return { success: false, error: 'Unable to process registration request right now.' };
  }
}

export async function completeRegistration(
  tokenRaw: string,
  password: string,
  confirmPassword: string,
) {
  const parsed = completeSchema.safeParse({ tokenRaw, password, confirmPassword });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid registration data.',
    };
  }

  try {
    const now = new Date();
    const tokenHash = hashToken(parsed.data.tokenRaw);

    const inviteToken = await prisma.emailToken.findFirst({
      where: {
        tokenHash,
        type: EmailTokenType.INVITE,
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        userId: true,
        staffId: true,
        email: true,
      },
    });

    if (!inviteToken) {
      return { success: false, error: 'Link expired or invalid' };
    }

    let user =
      inviteToken.userId != null
        ? await prisma.user.findUnique({ where: { id: inviteToken.userId } })
        : null;

    if (!user && inviteToken.staffId) {
      user = await prisma.user.findUnique({ where: { staffId: inviteToken.staffId } });
    }

    if (!user) {
      const staff = await prisma.staff.findFirst({
        where: {
          institutionalEmail: {
            equals: inviteToken.email,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });

      if (staff) {
        user = await prisma.user.findUnique({ where: { staffId: staff.id } });
      }
    }

    if (!user || user.passwordHash !== '') {
      return { success: false, error: 'Link expired or invalid' };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          lastLoginAt: null,
        },
      }),
      prisma.emailToken.update({
        where: { id: inviteToken.id },
        data: { usedAt: now },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('completeRegistration error:', error);
    return { success: false, error: 'Unable to complete registration right now.' };
  }
}
