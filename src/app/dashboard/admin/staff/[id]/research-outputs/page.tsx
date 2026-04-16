import { listMyResearchOutputs } from '@/server/queries/profileResearchOutputs';
import { ResearchOutputsClientView } from '@/components/profile/ResearchOutputsClientView';

export default async function AdminStaffResearchOutputsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id: staffId } = await params;
  const parsedSearchParams = await searchParams;
  const page = parseInt(parsedSearchParams.page || '1', 10);
  const pageSize = 10;

  const data = await listMyResearchOutputs({ staffId, page, pageSize });
  const basePath = `/dashboard/admin/staff/${staffId}`;

  return (
    <div className="space-y-6">
      <ResearchOutputsClientView data={data} staffId={staffId} basePath={basePath} />
    </div>
  );
}
