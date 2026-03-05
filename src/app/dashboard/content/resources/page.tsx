import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { ScopedRole } from '@prisma/client';
import { listResources } from '@/server/queries/resources';
import { ResourceListClient } from '@/components/content/ResourceListClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || '1', 10);
  const q = resolvedParams.q;
  const status = resolvedParams.status;

  const { data, total, pageSize } = await listResources({
    q,
    status,
    page,
    pageSize: 15,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Resources & Documents"
          description="Manage digital administrative materials like timetables, handbooks, and direct links."
        />
        <AddNewButton href="/dashboard/content/resources/new" label="Add New Resource" />
      </div>

      <ResourceListClient
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        searchQuery={q}
        statusQuery={status}
      />
    </div>
  );
}
