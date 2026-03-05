import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { ResearchGroupFormClient } from '@/components/research/ResearchGroupFormClient';

export default async function NewResearchGroupPage() {
  const session = await requireAuth();
  await requireSuperAdmin(session);

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
        title="New Research Group"
        description="Create a new research group for the department."
      />

      <ResearchGroupFormClient />
    </div>
  );
}
