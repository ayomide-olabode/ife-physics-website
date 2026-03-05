'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge, type PublishStatus } from '@/components/dashboard/StatusBadge';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteEventOpportunity } from '@/server/actions/eventsOpportunities';
import { toastSuccess, toastError } from '@/lib/toast';
import { Pencil, Trash2 } from 'lucide-react';

type EOItem = {
  id: string;
  title: string;
  type: string;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
  deadline: Date | null;
  status: PublishStatus;
};

type PaginationInfo = {
  page: number;
  totalPages: number;
  total: number;
};

function formatDateRange(start: Date | null, end: Date | null) {
  if (!start && !end) return '—';
  const s = start ? new Date(start).toLocaleDateString() : '';
  const e = end ? new Date(end).toLocaleDateString() : '';
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export function EOListClient({
  items,
  pagination,
}: {
  items: EOItem[];
  pagination: PaginationInfo;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteEventOpportunity(deleteTarget);
      if (res.success) {
        toastSuccess('Item deleted.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to delete.');
      }
      setDeleteTarget(null);
    });
  };

  const headers = ['Title', 'Type', 'Dates', 'Deadline', 'Venue', 'Status', 'Actions'];
  const rows = items.map((item) => [
    <Link
      key={`t-${item.id}`}
      href={`/dashboard/communication/events-opportunities/${item.id}`}
      className="font-medium text-primary hover:underline"
    >
      {item.title}
    </Link>,
    <span key={`ty-${item.id}`} className="text-xs font-mono uppercase">
      {item.type}
    </span>,
    <span key={`d-${item.id}`} className="text-sm text-muted-foreground">
      {formatDateRange(item.startDate, item.endDate)}
    </span>,
    <span key={`dl-${item.id}`} className="text-sm text-muted-foreground">
      {item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}
    </span>,
    <span key={`v-${item.id}`} className="text-sm text-muted-foreground">
      {item.venue || '—'}
    </span>,
    <StatusBadge key={`s-${item.id}`} status={item.status} />,
    <div key={`a-${item.id}`} className="flex items-center gap-2">
      <Link href={`/dashboard/communication/events-opportunities/${item.id}`}>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDeleteTarget(item.id)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>,
  ]);

  return (
    <>
      <DataTable
        headers={headers}
        rows={rows}
        emptyState={
          <EmptyState
            title="No events or opportunities yet"
            description="Create your first item to get started."
          />
        }
        footer={
          pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <Link
                    href={`/dashboard/communication/events-opportunities?page=${pagination.page - 1}`}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={`/dashboard/communication/events-opportunities?page=${pagination.page + 1}`}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Item"
        description="Are you sure you want to delete this event/opportunity?"
        confirmText="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
