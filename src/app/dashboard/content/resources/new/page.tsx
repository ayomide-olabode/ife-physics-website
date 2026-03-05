import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResourceFormClient } from '@/components/content/ResourceFormClient';
import { ScopedRole } from '@prisma/client';
import { BackToParent } from '@/components/dashboard/BackToParent';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/content/resources" label="Resources" />
        <PageHeader
          title="New Resource"
          description="Build a new direct link or upload a PDF document for users."
        />
      </div>

      <ResourceFormClient />
    </div>
  );
}
