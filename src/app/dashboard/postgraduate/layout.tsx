import { requireAuth, requireGlobalRole } from '@/lib/guards';

export default async function PostgraduateLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  return <>{children}</>;
}
