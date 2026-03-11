'use client';

import { useState } from 'react';
import { ProjectEditor } from './ProjectEditor';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteMyProject } from '@/server/actions/profileProjects';
import { getMyProjectById } from '@/server/queries/profileProjects';
import { toastSuccess, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ProjectFormData = {
  title: string;
  acronym: string;
  descriptionHtml: string;
  url: string;
  status: string;
  isFunded: boolean;
  startYear: string;
  endYear: string;
};

type ProjectEditorProps = {
  id: string;
} & ProjectFormData;

type ProjectItem = {
  id: string;
  title: string;
  acronym: string | null;
  status: string;
  isFunded: boolean;
  startYear: number;
  endYear: number | null;
  url: string | null;
  createdAt: Date;
};

type PaginatedData = {
  items: ProjectItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function ProjectsClientView({ data, staffId }: { data: PaginatedData; staffId: string }) {
  const router = useRouter();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<ProjectEditorProps | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditorData(undefined);
    setEditorOpen(true);
  };

  const handleEdit = async (id: string) => {
    // Fetch full project logic since list API omits `description`
    try {
      const fullDoc = await getMyProjectById({ staffId, id });
      if (!fullDoc) {
        toastError('Project not found or inaccessible.');
        return;
      }
      setEditorData({
        id: fullDoc.id,
        title: fullDoc.title,
        acronym: fullDoc.acronym || '',
        descriptionHtml: fullDoc.descriptionHtml || '',
        url: fullDoc.url || '',
        status: fullDoc.status,
        isFunded: fullDoc.isFunded,
        startYear: fullDoc.startYear.toString(),
        endYear: fullDoc.endYear ? fullDoc.endYear.toString() : '',
      });
      setEditorOpen(true);
    } catch {
      toastError('Error fetching project details.');
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await deleteMyProject(deleteId);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Project deleted successfully.');
        setDeleteOpen(false);
        router.refresh();
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
        title="Projects"
        description="Manage your ongoing and completed projects natively mapping identities efficiently."
        actions={
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Add New Project
          </button>
        }
      />

      <DataTable
        headers={['Title', 'Status', 'Years', 'Link', 'Actions']}
        rows={data.items.map((item) => [
          <div key="title" className="text-sm block min-w-[300px]">
            <span className="font-medium">{item.title}</span>
            {item.acronym && <span className="text-muted-foreground ml-2">({item.acronym})</span>}
            {item.isFunded && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                Funded
              </span>
            )}
          </div>,
          <span key="status" className="text-sm text-muted-foreground capitalize">
            {item.status.toLowerCase()}
          </span>,
          <span key="years" className="text-sm text-muted-foreground">
            {item.startYear} - {item.endYear || 'Ongoing'}
          </span>,
          <div key="links" className="flex flex-col gap-1">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Link
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>,

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
            title="No projects yet"
            description="Add your first project to get started."
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
                href={`/dashboard/profile/projects?page=${data.page - 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link
                href={`/dashboard/profile/projects?page=${data.page + 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      <ProjectEditor open={editorOpen} onOpenChange={setEditorOpen} initialData={editorData} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project?"
        description="Are you sure you want to remove this project? This action is permanent."
        onConfirm={handleConfirmDelete}
        destructive={true}
      />
    </>
  );
}
