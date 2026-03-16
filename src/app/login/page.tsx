'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/forms/PasswordInput';
import Link from 'next/link';
import { AuthCardShell } from '@/components/auth/AuthCardShell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials. Please try again.');
      setIsLoading(false);
    } else {
      const session = await getSession();
      if (session?.user?.firstLogin) {
        router.push('/dashboard/profile/overview?onboarding=1');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    }
  }

  return (
    <AuthCardShell
      title="Welcome Back!"
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-brand-navy hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@oauife.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Forgot?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="[&>input]:rounded-none [&>input]:bg-white"
              required
            />
          </div>
        </div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" className="w-full rounded-none" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </AuthCardShell>
  );
}
