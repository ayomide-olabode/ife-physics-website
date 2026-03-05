'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteResource } from '@/server/actions/resources';
import { toastSuccess, toastError } from '@/lib/toast';
import { Pencil, Trash2, Eye, Search, Link as LinkIcon, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PublishStatus } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResourcePreviewModal } from './ResourcePreviewModal';

type ResourceItem = {
  id: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
  fileUrl: string | null;
  status: PublishStatus;
  createdAt: Date;
};

interface Props {
  data: ResourceItem[];
  total: number;
  page: number;
  pageSize: number;
  searchQuery?: string;
  statusQuery?: string;
}

export function ResourceListClient({
  data,
  total,
  page,
  pageSize,
  searchQuery = '',
  statusQuery = 'ALL',
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(searchQuery);
  const [status, setStatus] = useState<PublishStatus | 'ALL'>(
    (statusQuery as PublishStatus) || 'ALL',
  );

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status && status !== 'ALL') params.set('status', status);
    params.set('page', '1');
    router.push(`/dashboard/content/resources?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status && status !== 'ALL') params.set('status', status);
    params.set('page', newPage.toString());
    router.push(`/dashboard/content/resources?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResource(deleteTarget);
      toastSuccess('Resource deleted.');
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to delete resource.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: (row: ResourceItem) => <span className="font-medium">{row.title}</span>,
    },
    {
      header: 'Asset',
      accessor: (row: ResourceItem) => (
        <div className="flex gap-2">
          {row.fileUrl && (
            <span
              title="Uploaded PDF Document"
              className="inline-flex items-center justify-center p-1.5 rounded-full bg-blue-100 text-blue-600"
            >
              <FileText className="w-3.5 h-3.5" />
            </span>
          )}
          {row.linkUrl && (
            <span
              title="External Link"
              className="inline-flex items-center justify-center p-1.5 rounded-full bg-orange-100 text-orange-600"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: ResourceItem) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Created',
      accessor: (row: ResourceItem) => (
        <span className="text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: ResourceItem) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPreviewTarget(row.id)}
            title="Preview Snapshot"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/content/resources/${row.id}`)}
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.id)}>
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
            placeholder="Search resources..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={(val: PublishStatus | 'ALL') => setStatus(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value={PublishStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={PublishStatus.PUBLISHED}>Published</SelectItem>
              <SelectItem value={PublishStatus.ARCHIVED}>Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch}>Filter</Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No Resources Found"
          description={
            searchQuery || statusQuery !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Start adding resources like handbooks, timetables, and links.'
          }
          action={
            <Button
              onClick={() => {
                if (searchQuery || statusQuery !== 'ALL') {
                  router.push('/dashboard/content/resources');
                } else {
                  router.push('/dashboard/content/resources/new');
                }
              }}
            >
              {searchQuery ? 'Clear Filters' : 'Add Your First Resource'}
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
                Showing entries {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{' '}
                {total}
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

      {previewTarget && (
        <ResourcePreviewModal itemId={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Resource Document"
        description="Are you sure you want to delete this resource? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        destructive={true}
      />
    </div>
  );
}
