import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResearchOutputEntryForm } from '@/components/profile/ResearchOutputEntryForm';

export default async function AdminStaffNewResearchOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: staffId } = await params;
  const basePath = `/dashboard/admin/staff/${staffId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href={`${basePath}/research-outputs`} label="Back to Research Outputs" />
        <PageHeader title="New Research Output" description="Add a research output." />
      </div>

      <ResearchOutputEntryForm staffId={staffId} basePath={basePath} />
    </div>
  );
}
