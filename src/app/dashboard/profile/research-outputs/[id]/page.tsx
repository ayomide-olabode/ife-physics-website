import { requireAuth } from '@/lib/guards';
import { getMyResearchOutputById } from '@/server/queries/profileResearchOutputs';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResearchOutputFormClient } from '@/components/profile/ResearchOutputFormClient';
import { notFound } from 'next/navigation';

export default async function EditResearchOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  const { id } = await params;
  const data = await getMyResearchOutputById({ staffId, id });

  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/profile/research-outputs" label="Back to Research Outputs" />
        <PageHeader
          title="Edit Research Output"
          description="Update the details of this research output."
        />
      </div>

      <ResearchOutputFormClient
        initialData={{
          id: data.id,
          type: data.type,
          title: data.title,
          authors: data.authors,
          year: data.year?.toString() || '',
          venue: data.venue || '',
          url: data.url || '',
          doi: data.doi || '',
          metaJson: (data.metaJson || {}) as Record<string, string>,
          authorsJson: (data.authorsJson || []) as Array<{
            staffId?: string | null;
            given_name: string;
            family_name: string;
          }>,
        }}
      />
    </div>
  );
}
