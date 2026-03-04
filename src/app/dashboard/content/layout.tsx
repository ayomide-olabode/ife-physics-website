import { requireAuth, requireGlobalRole } from '@/lib/guards';

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'EDITOR');

  return <>{children}</>;
}
