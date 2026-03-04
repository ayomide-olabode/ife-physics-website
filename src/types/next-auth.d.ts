import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      userId: string;
      staffId: string;
      isSuperAdmin: boolean;
      email?: string | null;
    };
  }

  interface User {
    userId: string;
    staffId: string;
    isSuperAdmin: boolean;
    email?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    staffId: string;
    isSuperAdmin: boolean;
  }
}
