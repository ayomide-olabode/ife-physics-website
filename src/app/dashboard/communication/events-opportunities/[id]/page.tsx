import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { notFound } from 'next/navigation';
import { getEventOpportunityById } from '@/server/queries/eventsOpportunities';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EOFormClient } from '@/components/communication/EOFormClient';
import { EOStatusActions } from '@/components/communication/EOStatusActions';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const item = await getEventOpportunityById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BackToParent
        href="/dashboard/communication/events-opportunities"
        label="Back to Events & Opportunities"
      />
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader title="Edit Event / Opportunity" description={`Editing "${item.title}"`} />
        <EOStatusActions id={item.id} status={item.status} />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <EOFormClient
          initial={{
            id: item.id,
            title: item.title,
            type: item.type,
            startDate: item.startDate?.toISOString() ?? null,
            endDate: item.endDate?.toISOString() ?? null,
            venue: item.venue,
            link: item.link,
            deadline: item.deadline?.toISOString() ?? null,
          }}
        />
      </div>
    </div>
  );
}
