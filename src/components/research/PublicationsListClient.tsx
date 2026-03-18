'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deletePublication, toggleFeatured } from '@/server/actions/publications';
import { toastSuccess, toastError } from '@/lib/toast';
import { Pencil, Trash2, Search, Star } from 'lucide-react';

type PublicationItem = {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  isFeatured: boolean;
  createdAt: Date;
};

interface Props {
  groupId: string;
  data: PublicationItem[];
  total: number;
  page: number;
  pageSize: number;
  searchQuery?: string;
  yearQuery?: string;
}

export function PublicationsListClient({
  groupId,
  data,
  total,
  page,
  pageSize,
  searchQuery = '',
  yearQuery = '',
}: Props) {
  const router = useRouter();
  const basePath = `/dashboard/research/groups/${groupId}/publications`;

  const [q, setQ] = useState(searchQuery);
  const [year, setYear] = useState(yearQuery);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (year) params.set('year', year);
    params.set('page', '1');
    router.push(`${basePath}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (year) params.set('year', year);
    params.set('page', newPage.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deletePublication(groupId, deleteTarget);
      if (res.success) {
        toastSuccess('Research output deleted.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to delete research output.');
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to delete.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setTogglingId(id);
    try {
      const res = await toggleFeatured(groupId, id, !currentFeatured);
      if (res.success) {
        toastSuccess(currentFeatured ? 'Removed from featured.' : 'Marked as featured.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to toggle featured.');
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to toggle.');
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      header: 'Year',
      accessor: (row: PublicationItem) =>
        row.year ? (
          <span className="font-medium tabular-nums">{row.year}</span>
        ) : (
          <span className="text-muted-foreground italic">—</span>
        ),
    },
    {
      header: 'Title',
      accessor: (row: PublicationItem) => (
        <span className="font-medium line-clamp-2">{row.title}</span>
      ),
    },
    {
      header: 'Venue',
      accessor: (row: PublicationItem) =>
        row.venue ? (
          <span className="text-sm text-muted-foreground line-clamp-1">{row.venue}</span>
        ) : (
          <span className="text-muted-foreground italic">—</span>
        ),
    },
    {
      header: 'Featured',
      accessor: (row: PublicationItem) => (
        <Button
          variant="ghost"
          size="icon"
          disabled={togglingId === row.id}
          onClick={() => handleToggleFeatured(row.id, row.isFeatured)}
          title={row.isFeatured ? 'Remove from featured' : 'Mark as featured'}
        >
          <Star
            className={`w-4 h-4 ${row.isFeatured ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
          />
        </Button>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: PublicationItem) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`${basePath}/${row.id}`)}
            title="Edit"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, authors, venue..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="w-32">
          <Input
            placeholder="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>Filter</Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No research outputs yet"
          description={
            searchQuery || yearQuery
              ? 'Try adjusting your filters.'
              : 'Add your first research output to this research group.'
          }
          action={
            <Button
              onClick={() => {
                if (searchQuery || yearQuery) {
                  router.push(basePath);
                } else {
                  router.push(`${basePath}/new`);
                }
              }}
            >
              {searchQuery || yearQuery ? 'Clear Filters' : 'Add First Research Output'}
            </Button>
          }
        />
      ) : (
        <DataTable
          headers={columns.map((c) => c.header)}
          rows={data.map((row) => columns.map((col) => col.accessor(row)))}
          footer={
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= total}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Research Output"
        description="Are you sure you want to delete this research output? This action will soft-delete it."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        destructive={true}
      />
    </div>
  );
}
