import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function UndergraduateLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  return (
    <>
      <ModuleTabs
        tabs={[
          { label: 'PHY', href: '/dashboard/undergraduate/phy' },
          { label: 'EPH', href: '/dashboard/undergraduate/eph' },
          { label: 'SLT', href: '/dashboard/undergraduate/slt' },
        ]}
      />
      {children}
    </>
  );
}
