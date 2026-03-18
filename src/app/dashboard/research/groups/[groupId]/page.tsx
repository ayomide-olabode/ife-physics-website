import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { requireAuth } from '@/lib/guards';
import { getResearchGroupByIdForUser } from '@/server/queries/researchGroups';
import { ResearchGroupFormClient } from '@/components/research/ResearchGroupFormClient';
import { listRecentResearchOutputsForGroupMembers } from '@/server/queries/researchGroupPublicationsFromMembers';
import { ResearchGroupFeaturedResearchOutputClient } from '@/components/research/ResearchGroupFeaturedResearchOutputClient';
import { FocusAreasInlineEditor } from '@/components/research/FocusAreasInlineEditor';
import { listFocusAreasForGroup } from '@/server/queries/focusAreas';

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

  const [eligibleResearchOutputs, focusAreas] = await Promise.all([
    listRecentResearchOutputsForGroupMembers({
      groupId: resolvedParams.groupId,
    }),
    listFocusAreasForGroup({ groupId: resolvedParams.groupId }),
  ]);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/research/groups" label="Back to Groups" />

      <PageHeader
        title={`Edit Research Group — ${group.name}`}
        description={`Update details for ${group.abbreviation}.`}
      />

      <ResearchGroupFormClient initialData={group} />

      <FocusAreasInlineEditor groupId={group.id} initialItems={focusAreas} />

      <ResearchGroupFeaturedResearchOutputClient
        groupId={group.id}
        initialFeaturedOutputId={group.featuredResearchOutputId}
        eligibleResearchOutputs={eligibleResearchOutputs}
      />
    </div>
  );
}
