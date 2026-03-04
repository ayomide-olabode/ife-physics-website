import { requireAuth, requireAnyResearchLead } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function ResearchLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireAnyResearchLead(session);

  return (
    <>
      <ModuleTabs tabs={[{ label: 'Groups', href: '/dashboard/research/groups' }]} />
      {children}
    </>
  );
}
