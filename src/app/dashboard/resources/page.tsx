import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/guards';
import { hasGlobalRole, isCurrentHod, isSuperAdmin } from '@/lib/rbac';

export default async function DashboardResourcesPage() {
  const session = await requireAuth();
  const canAccess =
    isSuperAdmin(session) ||
    (await hasGlobalRole(session, 'EDITOR')) ||
    (await isCurrentHod(session));

  if (!canAccess) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Resources Management</h1>
    </main>
  );
}
