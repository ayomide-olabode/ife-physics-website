import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { listEventsOpportunities } from '@/server/queries/eventsOpportunities';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { EOListClient } from '@/components/communication/EOListClient';

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const { items, total, totalPages } = await listEventsOpportunities({
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Events & Opportunities"
          description="Manage events, conferences, workshops, and opportunities."
        />
        <AddNewButton href="/dashboard/communication/events-opportunities/new" label="New Item" />
      </div>
      <EOListClient items={items} pagination={{ page, totalPages, total }} />
    </div>
  );
}
