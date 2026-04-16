import { notFound } from 'next/navigation';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ThesisEntryForm } from '@/components/profile/ThesisEntryForm';
import { getMyThesisById } from '@/server/queries/profileTheses';

export default async function AdminStaffEditThesisPage({
  params,
}: {
  params: Promise<{ id: string; thesisId: string }>;
}) {
  const { id: staffId, thesisId } = await params;
  const data = await getMyThesisById({ staffId, id: thesisId });
  const basePath = `/dashboard/admin/staff/${staffId}`;

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href={`${basePath}/thesis-supervision`} label="Back to Thesis Supervision" />
        <PageHeader
          title="Edit Student Thesis"
          description="Update the details of this thesis/dissertation."
        />
      </div>

      <ThesisEntryForm
        staffId={staffId}
        initialData={{
          id: data.id,
          year: data.year.toString(),
          title: data.title,
          studentName: data.studentName || '',
          registrationNumber: data.registrationNumber || '',
          programme: data.programme || '',
          degreeLevel: data.degreeLevel || '',
          externalUrl: data.externalUrl || '',
          status: data.status,
        }}
        redirectTo={`${basePath}/thesis-supervision`}
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
