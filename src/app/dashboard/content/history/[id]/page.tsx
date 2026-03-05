import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getHistoryById } from '@/server/queries/history';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { HistoryFormClient } from '@/components/content/HistoryFormClient';
import { HistoryStatusActions } from '@/components/content/HistoryStatusActions';
import { ScopedRole } from '@prisma/client';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const data = await getHistoryById(id);

  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard/content/history">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title="Edit History Entry" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HistoryFormClient initialData={data} />
        </div>

        <div className="lg:col-span-1 border rounded-lg p-6 bg-white shadow-sm h-fit space-y-4">
          <h3 className="font-semibold text-lg pb-2 border-b">Publishing Workflow</h3>
          <HistoryStatusActions historyId={data.id} currentStatus={data.status} />
        </div>
      </div>
    </div>
  );
}
