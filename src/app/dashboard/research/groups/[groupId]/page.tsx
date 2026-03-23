import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { requireAuth } from '@/lib/guards';
import { getResearchGroupByIdForUser } from '@/server/queries/researchGroups';
import { ResearchGroupFormClient } from '@/components/research/ResearchGroupFormClient';
import { listResearchOutputsForGroupMembers } from '@/server/queries/researchGroupOutputs';
import { FocusAreasInlineEditor } from '@/components/research/FocusAreasInlineEditor';
import { listFocusAreasForGroup } from '@/server/queries/focusAreas';
import { ResearchGroupOutputsTableClient } from '@/components/research/ResearchGroupOutputsTableClient';

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function EditResearchGroupPage({ params }: PageProps) {
  const session = await requireAuth();
  const resolvedParams = await params;

  // Access check is handled inside the query (superadmin or scoped lead)
  const group = await getResearchGroupByIdForUser({
    session,
    groupId: resolvedParams.groupId,
  });

  if (!group) {
    notFound();
  }

  const [researchOutputs, focusAreas] = await Promise.all([
    listResearchOutputsForGroupMembers({
      groupId: resolvedParams.groupId,
      pageSize: 20,
    }),
    listFocusAreasForGroup({ groupId: resolvedParams.groupId }),
  ]);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/research/groups" label="Back to Research Groups" />

      <PageHeader
        title={`Edit Research Group — ${group.name}`}
        description={`Update details for ${group.abbreviation}.`}
      />

      <ResearchGroupFormClient initialData={group} />

      <FocusAreasInlineEditor groupId={group.id} initialItems={focusAreas} />

      <div className="space-y-4">
        <PageHeader
          title="Research Outputs"
          description="Manage and feature research outputs authored by group members."
        />
        <ResearchGroupOutputsTableClient groupId={group.id} items={researchOutputs.items} />
      </div>
    </div>
  );
}
