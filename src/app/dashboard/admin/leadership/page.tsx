import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { listLeadershipTerms } from '@/server/queries/leadershipTerms';
import { LeadershipTermManager, TermRow } from '@/components/admin/LeadershipTermManager';

export default async function AdminLeadershipPage() {
  // Fetch HOD terms
  const { items: hodAll } = await listLeadershipTerms({ role: 'HOD', pageSize: 100 });
  const hodActive = hodAll.filter((t) => !t.endDate);
  const hodPast = hodAll.filter((t) => t.endDate);

  // Fetch Coordinators (both active and past combined for now, though we can split if needed)
  const { items: coordinatorsAll } = await listLeadershipTerms({
    role: 'ACADEMIC_COORDINATOR',
    pageSize: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leadership"
        description="Manage Heads of Department and Academic Coordinators."
        actions={<AddNewButton href="/dashboard/admin/leadership/new" />}
      />

      <LeadershipTermManager
        hodTerms={hodActive as unknown as TermRow[]}
        pastHodTerms={hodPast as unknown as TermRow[]}
        coordinatorTerms={coordinatorsAll as unknown as TermRow[]}
      />
    </div>
  );
}
