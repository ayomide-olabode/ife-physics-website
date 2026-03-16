'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/forms/PasswordInput';
import Link from 'next/link';

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="bg-brand-navy py-2 px-4 rounded-lg text-brand-white hover:text-brand-yellow transition-colors"
        >
          Back to home
        </Link>
      </div>
      <div className="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex flex-col space-y-1.5 pb-6">
          <h3 className="font-semibold tracking-tight text-2xl">Sign In</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to access the dashboard.
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Institutional Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@oauife.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
