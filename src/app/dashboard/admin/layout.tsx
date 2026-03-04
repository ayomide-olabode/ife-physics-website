import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  return (
    <>
      <ModuleTabs
        tabs={[
          { label: 'Users', href: '/dashboard/admin/users' },
          { label: 'Audit Logs', href: '/dashboard/admin/audit-logs' },
        ]}
      />
      {children}
    </>
  );
}
