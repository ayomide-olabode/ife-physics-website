import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getRollOfHonourById } from '@/server/queries/rollOfHonour';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { RollOfHonourFormClient } from '@/components/content/RollOfHonourFormClient';
import { ScopedRole } from '@prisma/client';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const data = await getRollOfHonourById(id);

  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard/content/roll-of-honour">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title="Edit Roll of Honour Entry" />
      </div>

      <RollOfHonourFormClient
        initialData={{
          ...data,
          registrationNumber: data.registrationNumber ?? '',
          cgpa: data.cgpa ?? 0,
        }}
      />
    </div>
  );
}
