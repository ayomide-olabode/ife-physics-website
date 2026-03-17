'use client';

import { CheckEmailActions } from '@/components/auth/CheckEmailActions';
import { requestPasswordResetLink } from '@/server/actions/passwordReset';

type Props = {
  email: string;
};

export function ForgotPasswordCheckEmailClient({ email }: Props) {
  return (
    <CheckEmailActions
      email={email}
      backHref="/login"
      onResend={async () => {
        const result = await requestPasswordResetLink(email);
        if (result.success && result.status === 'THROTTLED') {
          return {
            status: 'THROTTLED' as const,
            minutesRemaining: result.minutesRemaining,
          };
        }
        return { status: 'SENT' as const };
      }}
    />
  );
}
