import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getResourceById } from '@/server/queries/resources';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResourceFormClient } from '@/components/content/ResourceFormClient';
import { ResourceStatusActions } from '@/components/content/ResourceStatusActions';
import { ScopedRole } from '@prisma/client';
import { notFound } from 'next/navigation';
import { BackToParent } from '@/components/dashboard/BackToParent';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const data = await getResourceById(id);

  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <BackToParent href="/dashboard/content/resources" label="Resources" />
        </div>

        <div className="flex items-center justify-between">
          <PageHeader title="Edit Resource" />
          <ResourceStatusActions itemId={data.id} currentStatus={data.status} />
        </div>
      </div>

      <ResourceFormClient
        initialData={{
          id: data.id,
          title: data.title,
          description: data.description || '',
          linkUrl: data.linkUrl || '',
          fileUrl: data.fileUrl || '',
          category: data.category || '',
        }}
      />
    </div>
  );
}
