'use client';

import { useState } from 'react';
import { ThesisEditor } from './ThesisEditor';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteMyThesis } from '@/server/actions/profileTheses';
import { getMyThesisById, ThesisRow } from '@/server/queries/profileTheses';
import { toastSuccess, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PaginatedData = {
  items: ThesisRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function ThesesClientView({ data, staffId }: { data: PaginatedData; staffId: string }) {
  const router = useRouter();

  const [editorOpen, setEditorOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorData, setEditorData] = useState<any | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditorData(undefined);
    setEditorOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const fullDoc = await getMyThesisById({ staffId, id });
      if (!fullDoc) {
        toastError('Thesis not found or inaccessible.');
        return;
      }
      setEditorData({
        id: fullDoc.id,
        year: fullDoc.year.toString(),
        title: fullDoc.title,
        studentName: fullDoc.studentName || '',
        programme: fullDoc.programme || '',
        degreeLevel: fullDoc.degreeLevel || '',
        externalUrl: fullDoc.externalUrl || '',
        status: fullDoc.status,
      });
      setEditorOpen(true);
    } catch {
      toastError('Error fetching thesis details.');
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await deleteMyThesis(deleteId);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Thesis deleted successfully.');
        setDeleteOpen(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurrred.');
    } finally {
      setDeleteId(null);
    }
  };

  // Status mapping to nicely formatted badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Ongoing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'DISCONTINUED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Discontinued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <>
      <PageHeader
        title="Student Theses"
        description="Manage the student theses and dissertations you have supervised or are currently supervising."
        actions={
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Add New Thesis
          </button>
        }
      />

      <DataTable
        headers={['Year', 'Title', 'Student', 'Status', 'Actions']}
        rows={data.items.map((item) => [
          <span key="year" className="text-sm">
            {item.year}
          </span>,
          <span key="title" className="text-sm block min-w-[200px] font-medium">
            {item.title}
          </span>,
          <span key="student" className="text-sm text-muted-foreground">
            {item.studentName || '-'}
          </span>,
          <div key="status">{getStatusBadge(item.status)}</div>,
          <div key="actions" className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(item.id)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              onClick={() => handleDeleteRequest(item.id)}
              className="text-sm text-destructive hover:text-red-800 font-medium"
            >
              Delete
            </button>
          </div>,
        ])}
        emptyState={
          <EmptyState
            title="No theses yet"
            description="Add your first student thesis to get started."
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
                href={`/dashboard/profile/theses?page=${data.page - 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link
                href={`/dashboard/profile/theses?page=${data.page + 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      <ThesisEditor open={editorOpen} onOpenChange={setEditorOpen} initialData={editorData} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Thesis?"
        description="Are you sure you want to remove this thesis? This action is permanent."
        onConfirm={handleConfirmDelete}
        destructive={true}
      />
    </>
  );
}
