import { requireAuth, requireSuperAdmin } from '@/lib/guards';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  return <>{children}</>;
}
