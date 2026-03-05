import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAuth } from '@/lib/guards';
import { getResearchGroupByIdForUser } from '@/server/queries/researchGroups';
import { ResearchGroupFormClient } from '@/components/research/ResearchGroupFormClient';

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

  return (
    <div className="space-y-6">
      <div className="text-sm border-b pb-2 mb-4">
        <Link
          href="/dashboard/research/groups"
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          &larr; Back to Groups
        </Link>
      </div>

      <PageHeader
        title={`Edit Research Group — ${group.name}`}
        description={`Update details for ${group.abbreviation}.`}
      />

      <ResearchGroupFormClient initialData={group} />
    </div>
  );
}
