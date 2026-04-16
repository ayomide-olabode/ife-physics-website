import { notFound } from 'next/navigation';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResearchOutputEntryForm } from '@/components/profile/ResearchOutputEntryForm';
import { getMyResearchOutputById } from '@/server/queries/profileResearchOutputs';
import { mapLegacyToApa } from '@/lib/legacyResearchOutputCompat';

export default async function AdminStaffEditResearchOutputPage({
  params,
}: {
  params: Promise<{ id: string; outputId: string }>;
}) {
  const { id: staffId, outputId } = await params;
  const data = await getMyResearchOutputById({ staffId, id: outputId });
  const basePath = `/dashboard/admin/staff/${staffId}`;

  if (!data) {
    notFound();
  }

  const compat = mapLegacyToApa({
    type: data.type,
    authors: data.authors,
    doi: data.doi,
    venue: data.venue,
    authorsJson: data.authorsJson,
    keywordsJson: data.keywordsJson,
    metaJson: data.metaJson,
    sourceTitle: data.sourceTitle,
    publisher: data.publisher,
    groupAuthor: data.groupAuthor,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href={`${basePath}/research-outputs`} label="Back to Research Outputs" />
        <PageHeader title="Edit Research Output" description="Update this research output." />
      </div>

      <ResearchOutputEntryForm
        staffId={staffId}
        basePath={basePath}
        initialData={{
          id: data.id,
          type: data.type,
          title: data.title,
          authors: data.authors || '',
          groupAuthor: compat.groupAuthor,
          doi: compat.doi,
          year: data.year?.toString() || '',
          metaJson: compat.metaJson as Record<string, unknown>,
          authorsJson: compat.authorsJson,
        }}
      />
    </div>
  );
}
