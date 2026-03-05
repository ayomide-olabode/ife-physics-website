import { requireAuth } from '@/lib/guards';
import { listMyResearchOutputs } from '@/server/queries/profileResearchOutputs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ResearchOutputsClientWrapper } from '@/components/profile/ResearchOutputsClientWrapper';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default async function ProfileResearchOutputsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireAuth();
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const pageSize = 10;

  const data = await listMyResearchOutputs({ staffId, page, pageSize });

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/profile" label="Back to Profile" />

      <ResearchOutputsClientWrapper>
        {({ onAdd, onEdit, onDelete }) => (
          <>
            <PageHeader
              title="Research Outputs"
              description="Manage your publications, reports, and conference proceedings securely."
              actions={
                <button
                  onClick={onAdd}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Add New Output
                </button>
              }
            />

            <DataTable
              headers={['Type', 'Title', 'Year', 'Venue', 'Links', 'Actions']}
              rows={data.items.map((item) => [
                <span key="type" className="text-sm font-medium">
                  {item.type.replace(/_/g, ' ')}
                </span>,
                <span key="title" className="text-sm block min-w-[300px] font-medium">
                  {item.title}
                </span>,
                <span key="year" className="text-sm">
                  {item.year || '-'}
                </span>,
                <span key="venue" className="text-sm">
                  {item.venue || '-'}
                </span>,
                <div key="links" className="flex flex-col gap-1">
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
                  {item.doi && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      DOI: {item.doi}
                    </span>
                  )}
                </div>,
                <div key="actions" className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onEdit(item.id, {
                        type: item.type,
                        title: item.title,
                        year: item.year?.toString() || '',
                        venue: item.venue || '',
                        url: item.url || '',
                        doi: item.doi || '',
                      })
                    }
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-sm text-destructive hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </div>,
              ])}
              emptyState={
                <EmptyState
                  title="No research outputs"
                  description="You haven't added any research outputs to your profile yet."
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
          </>
        )}
      </ResearchOutputsClientWrapper>
    </div>
  );
}
