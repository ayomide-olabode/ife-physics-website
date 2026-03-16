'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteMyResearchOutput } from '@/server/actions/profileResearchOutputs';
import { toastSuccess, toastError } from '@/lib/toast';
import { ResearchOutputType, Prisma } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { AddNewButton } from '@/components/dashboard/AddNewButton';

type ResearchOutputItem = {
  id: string;
  type: ResearchOutputType;
  title: string;
  year: number | null;
  sourceTitle: string | null;
  publisher: string | null;
  venue: string | null;
  url: string | null;
  doi: string | null;
  metaJson: Prisma.JsonValue;
  createdAt: Date;
};

type PaginatedData = {
  items: ResearchOutputItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function ResearchOutputsClientView({ data }: { data: PaginatedData }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await deleteMyResearchOutput(deleteId);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Output deleted successfully.');
        setDeleteOpen(false);
      }
    } catch {
      toastError('An unexpected error occurrred.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Research Outputs"
        description="Manage your publications, reports, and conference proceedings securely."
        actions={
          <AddNewButton href="/dashboard/profile/research-outputs/new" label="Add New Output" />
        }
      />

      <DataTable
        headers={['Year', 'Type', 'Title', 'Source', 'DOI / URL', 'Actions']}
        rows={data.items.map((item) => {
          const m = (item.metaJson as Record<string, string>) || {};
          const metaSource =
            m.journal_title ||
            m.book_title ||
            m.conference_name ||
            m.publisher ||
            m.repository ||
            m.institution ||
            m.issuing_organization;

          const source = metaSource || item.sourceTitle || item.publisher || item.venue || '—';

          return [
            <span key="year" className="text-sm tabular-nums">
              {item.year || '—'}
            </span>,
            <span key="type" className="text-sm font-medium whitespace-nowrap">
              {item.type.replace(/_/g, ' ')}
            </span>,
            <div key="title" className="min-w-[250px]">
              <span className="text-sm font-semibold block line-clamp-2">{item.title}</span>
            </div>,
            <span key="source" className="text-sm line-clamp-2 max-w-[180px]">
              {source}
            </span>,
            <div key="links" className="flex flex-col gap-1">
              {item.doi && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  DOI: {item.doi}
                </span>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Link
                </a>
              )}
            </div>,
            <div key="actions" className="flex items-center gap-2">
              <Link
                href={`/dashboard/profile/research-outputs/${item.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </Link>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => handleDeleteRequest(item.id)}
                className="text-sm text-destructive hover:text-red-800 font-medium"
              >
                Delete
              </button>
            </div>,
          ];
        })}
        emptyState={
          <EmptyState
            title="No research outputs yet"
            description="Add your first research output to get started."
          />
        }
      />

      {data.totalPages > 1 && (
        <div className="flex justify-between items-center py-4 text-sm text-muted-foreground">
          <p>
            Showing page {data.page} of {data.totalPages} ({data.totalCount} total)
          </p>
          <div className="flex space-x-2">
            {data.page > 1 && (
              <Link
                href={`/dashboard/profile/research-outputs?page=${data.page - 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link
                href={`/dashboard/profile/research-outputs?page=${data.page + 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Research Output?"
        description="Are you sure you want to remove this publication from your profile? This action is permanent."
        onConfirm={handleConfirmDelete}
        destructive={true}
      />
    </>
  );
}
