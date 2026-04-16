import { notFound } from 'next/navigation';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProjectEntryForm } from '@/components/profile/ProjectEntryForm';
import { getMyProjectById } from '@/server/queries/profileProjects';

export default async function AdminStaffEditProjectPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: staffId, projectId } = await params;
  const data = await getMyProjectById({ staffId, id: projectId });
  const basePath = `/dashboard/admin/staff/${staffId}`;

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href={`${basePath}/projects`} label="Back to Projects" />
        <PageHeader title="Edit Project" description="Update the details of this project." />
      </div>

      <ProjectEntryForm
        staffId={staffId}
        initialData={{
          id: data.id,
          title: data.title,
          acronym: data.acronym || '',
          descriptionHtml: data.descriptionHtml || '',
          url: data.url || '',
          status: data.status,
          isFunded: data.isFunded,
          startYear: data.startYear.toString(),
          endYear: data.endYear ? data.endYear.toString() : '',
        }}
        redirectTo={`${basePath}/projects`}
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
