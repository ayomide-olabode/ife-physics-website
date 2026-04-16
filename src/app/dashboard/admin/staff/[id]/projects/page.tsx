import { listMyProjects } from '@/server/queries/profileProjects';
import { ProjectsClientView } from '@/components/profile/ProjectsClientView';

export default async function AdminStaffProjectsPage({
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
  const data = await listMyProjects({ staffId, page, pageSize });
  const basePath = `/dashboard/admin/staff/${staffId}`;

  return (
    <div className="space-y-6">
      <ProjectsClientView data={data} staffId={staffId} basePath={basePath} />
    </div>
  );
}
