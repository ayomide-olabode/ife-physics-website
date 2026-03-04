import { requireAuth, requireGlobalRole } from '@/lib/guards';

export default async function CommunicationLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'EDITOR');

  return <>{children}</>;
}
