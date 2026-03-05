import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { RollOfHonourFormClient } from '@/components/content/RollOfHonourFormClient';
import { ScopedRole } from '@prisma/client';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/content/roll-of-honour">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title="New Roll of Honour Entry" />
      </div>

      <RollOfHonourFormClient />
    </div>
  );
}
