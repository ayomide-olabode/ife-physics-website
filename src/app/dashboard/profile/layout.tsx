import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { ModuleTabs, type TabItem } from '@/components/dashboard/ModuleTabs';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const staffId = session.user?.staffId;

  if (!staffId) {
    return <>{children}</>;
  }

  const isHod = await prisma.leadershipTerm.findFirst({
    where: {
      staffId,
      role: 'HOD',
      endDate: null,
    },
  });

  const tabs: TabItem[] = [
    { label: 'Overview', href: '/dashboard/profile' },
    { label: 'Research Outputs', href: '/dashboard/profile/research-outputs' },
    { label: 'Projects', href: '/dashboard/profile/projects' },
    { label: 'Teaching', href: '/dashboard/profile/teaching' },
    { label: 'Theses', href: '/dashboard/profile/theses' },
  ];

  if (isHod) {
    tabs.push({ label: 'HOD Address', href: '/dashboard/profile/hod-address' });
  }

  return (
    <>
      <ModuleTabs tabs={tabs} />
      {children}
    </>
  );
}
