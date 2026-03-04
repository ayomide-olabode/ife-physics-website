import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function PostgraduateLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  return (
    <>
      <ModuleTabs
        tabs={[
          { label: 'PHY', href: '/dashboard/postgraduate/phy' },
          { label: 'EPH', href: '/dashboard/postgraduate/eph' },
          { label: 'SLT', href: '/dashboard/postgraduate/slt' },
        ]}
      />
      {children}
    </>
  );
}
