import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProjectEntryForm } from '@/components/profile/ProjectEntryForm';

export default async function AdminStaffNewProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: staffId } = await params;
  const basePath = `/dashboard/admin/staff/${staffId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href={`${basePath}/projects`} label="Back to Projects" />
        <PageHeader title="New Project" description="Add a new project to this staff profile." />
      </div>

      <ProjectEntryForm
        staffId={staffId}
        redirectTo={`${basePath}/projects`}
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
