import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'EDITOR');

  return (
    <>
      <ModuleTabs
        tabs={[
          { label: 'History', href: '/dashboard/content/history' },
          { label: 'Roll of Honour', href: '/dashboard/content/roll-of-honour' },
          { label: 'Legacy Gallery', href: '/dashboard/content/legacy-gallery' },
          { label: 'Resources', href: '/dashboard/content/resources' },
        ]}
      />
      {children}
    </>
  );
}
