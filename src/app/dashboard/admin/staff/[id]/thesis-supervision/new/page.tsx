import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ThesisEntryForm } from '@/components/profile/ThesisEntryForm';

export default async function AdminStaffNewThesisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: staffId } = await params;
  const basePath = `/dashboard/admin/staff/${staffId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href={`${basePath}/thesis-supervision`} label="Back to Thesis Supervision" />
        <PageHeader
          title="New Student Thesis"
          description="Add a new student thesis this staff supervises."
        />
      </div>

      <ThesisEntryForm
        staffId={staffId}
        redirectTo={`${basePath}/thesis-supervision`}
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
