'use client';

import { CheckEmailActions } from '@/components/auth/CheckEmailActions';
import { requestRegistrationLink } from '@/server/actions/onboardingRegister';

type Props = {
  email: string;
};

export function RegisterCheckEmailClient({ email }: Props) {
  return (
    <CheckEmailActions
      email={email}
      backHref="/register"
      onResend={async () => {
        const result = await requestRegistrationLink(email);
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
