import { listMyTheses } from '@/server/queries/profileTheses';
import { ThesesClientView } from '@/components/profile/ThesesClientView';

export default async function AdminStaffThesisSupervisionPage({
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
  const data = await listMyTheses({ staffId, page, pageSize });
  const basePath = `/dashboard/admin/staff/${staffId}`;

  return (
    <div className="space-y-6">
      <ThesesClientView data={data} staffId={staffId} basePath={basePath} />
    </div>
  );
}
