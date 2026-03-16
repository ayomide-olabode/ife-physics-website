'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { toastSuccess, toastError } from '@/lib/toast';
import { completeRegistration } from '@/server/actions/register';
import { AuthCardShell } from '@/components/auth/AuthCardShell';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toastError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toastError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await completeRegistration({ email, password });

      if (res.error) {
        toastError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        toastSuccess('Account created! Please sign in.');
        router.push('/login');
      }
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCardShell
      title="Create Account"
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-navy hover:underline">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@oauife.edu.ng"
              className="rounded-none bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
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
        </div>

        <Button type="submit" className="w-full rounded-none" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </AuthCardShell>
  );
}
