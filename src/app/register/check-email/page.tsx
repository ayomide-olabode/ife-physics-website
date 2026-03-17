import Link from 'next/link';
import { AuthCardShell } from '@/components/auth/AuthCardShell';
import { Button } from '@/components/ui/button';

type Props = {
  searchParams?: Promise<{ email?: string }>;
};

export default async function CheckEmailPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const email = params.email ?? 'your address';

  const mailtoLink = `mailto:${encodeURIComponent(email)}`;

  return (
    <AuthCardShell title="Check your mail">
      <div className="space-y-6 text-center">
        <p className="text-sm text-muted-foreground">
          We sent a link to <span className="font-medium text-foreground">{email}</span> if it
          exists in our system.
        </p>

        <div className="grid gap-3">
          <Button asChild className="w-full rounded-none">
            <Link href="https://mail.google.com" target="_blank" rel="noreferrer">
              Open Gmail
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-none">
            <Link href="https://outlook.office.com/mail" target="_blank" rel="noreferrer">
              Open Outlook
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-none">
            <Link href={mailtoLink}>Open Mail App</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-none">
            <Link href="/register">Back</Link>
          </Button>
        </div>
      </div>
    </AuthCardShell>
  );
}
