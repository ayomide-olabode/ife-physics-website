'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCardShell } from '@/components/auth/AuthCardShell';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { PasswordStrength } from '@/components/forms/PasswordStrength';
import { Button } from '@/components/ui/button';
import { toastError } from '@/lib/toast';
import { completeRegistration } from '@/server/actions/onboardingRegister';

type Props = {
  token: string;
};

export function ConfirmRegistrationClient({ token }: Props) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      toastError('Link expired or invalid');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeRegistration(token, password, confirmPassword);

      if (!result.success) {
        toastError(result.error ?? 'Link expired or invalid');
        setIsSubmitting(false);
        return;
      }

      router.push('/login?new=1');
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCardShell
      title="Email confirmed"
      subtitle="Create your password to finish account setup."
      footer={
        <p>
          Already set your password?{' '}
          <Link href="/login" className="font-medium text-brand-navy hover:underline">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Create Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="[&>input]:rounded-none [&>input]:bg-white"
            required
            minLength={8}
          />
          <PasswordStrength password={password} />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retype password"
            className="[&>input]:rounded-none [&>input]:bg-white"
            required
            minLength={8}
          />
        </div>

        <Button type="submit" className="w-full rounded-none" disabled={isSubmitting || !token}>
          {isSubmitting ? 'Setting password...' : 'Set password'}
        </Button>
      </form>
    </AuthCardShell>
  );
}
