import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // If no active session, unconditionally redirect back to login
  if (!session) {
    redirect('/login');
  }

  // NOTE: RBAC authorization logic handles internally later.
  // Currently gating purely based on active session existence.
  return <>{children}</>;
}
