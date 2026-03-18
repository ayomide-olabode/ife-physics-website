import { requireAuth } from '@/lib/guards';
import { listMyProjects } from '@/server/queries/profileProjects';
import { ProjectsClientView } from '@/components/profile/ProjectsClientView';

export default async function ProfileProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireAuth();
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const pageSize = 10;

  const data = await listMyProjects({ staffId, page, pageSize });

  return (
    <div className="space-y-6">
      <ProjectsClientView data={data} staffId={staffId} />
    </div>
  );
}
