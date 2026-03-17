'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toastError, toastSuccess } from '@/lib/toast';

type ResendResult = {
  status: 'SENT' | 'THROTTLED';
  minutesRemaining?: number;
};

type CheckEmailActionsProps = {
  email: string;
  onResend: () => Promise<ResendResult>;
  backHref: string;
};

const DEFAULT_COOLDOWN_SECONDS = 5 * 60;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.max(totalSeconds % 60, 0)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function CheckEmailActions({ email, onResend, backHref }: CheckEmailActionsProps) {
  const [isSending, setIsSending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(DEFAULT_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleResend() {
    setIsSending(true);
    try {
      const result = await onResend();

      if (result.status === 'THROTTLED') {
        const remainingSeconds = Math.max((result.minutesRemaining ?? 1) * 60, 60);
        setCooldownSeconds(remainingSeconds);
        toastError(
          `Email already sent recently. Please wait ${result.minutesRemaining ?? 1} minute(s).`,
        );
        return;
      }

      setCooldownSeconds(DEFAULT_COOLDOWN_SECONDS);
      toastSuccess('Email link sent. Check your inbox.');
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to resend email right now.');
    } finally {
      setIsSending(false);
    }
  }

  const mailtoLink = `mailto:${encodeURIComponent(email)}`;

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <Button asChild variant="ghost" className="w-full rounded-none">
          <Link href={backHref}>Back</Link>
        </Button>

        <details className="relative">
          <summary className="flex h-9 cursor-pointer list-none items-center justify-center rounded-none border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            Open email
          </summary>
          <div className="absolute left-0 right-0 z-10 mt-1 space-y-1 border bg-background p-2 shadow-md">
            <Link
              href="https://mail.google.com"
              target="_blank"
              rel="noreferrer"
              className="block px-2 py-1 text-sm hover:bg-accent"
            >
              Gmail
            </Link>
            <Link
              href="https://outlook.office.com/mail"
              target="_blank"
              rel="noreferrer"
              className="block px-2 py-1 text-sm hover:bg-accent"
            >
              Outlook
            </Link>
            <Link
              href="https://mail.yahoo.com"
              target="_blank"
              rel="noreferrer"
              className="block px-2 py-1 text-sm hover:bg-accent"
            >
              Yahoo Mail
            </Link>
            <Link href={mailtoLink} className="block px-2 py-1 text-sm hover:bg-accent">
              Open Mail App
            </Link>
          </div>
        </details>

        <Button
          type="button"
          onClick={handleResend}
          disabled={isSending || cooldownSeconds > 0}
          variant="outline"
          className="w-full rounded-none"
        >
          {isSending ? 'Sending...' : 'Resend email'}
        </Button>
      </div>

      {cooldownSeconds > 0 ? (
        <p className="text-xs text-muted-foreground text-right">
          Resend available in {formatCountdown(cooldownSeconds)}
        </p>
      ) : null}
    </div>
  );
}
