import { PageHeader } from '@/components/dashboard/PageHeader';
import { listAuditLogs } from '@/server/queries/auditLogs';
import { AuditLogViewer, AuditLogRow } from '@/components/admin/AuditLogViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { q?: string; entityType?: string; actorId?: string; page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 20;

  const { items, total } = await listAuditLogs({
    q: searchParams.q,
    entityType: searchParams.entityType,
    actorId: searchParams.actorId,
    page,
    pageSize,
  });

  const hasNextPage = page * pageSize < total;
  const hasPrevPage = page > 1;

  // Render URL construction securely
  const buildPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.entityType) params.set('entityType', searchParams.entityType);
    if (searchParams.actorId) params.set('actorId', searchParams.actorId);
    params.set('page', newPage.toString());
    return `/dashboard/admin/audit-logs?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Monitor system-wide administrative actions cleanly spanning multiple objects transparently tracking explicit payloads directly capturing context automatically internally."
      />

      <div className="bg-card text-card-foreground shadow-sm rounded-lg border p-4 space-y-4">
        <form className="flex flex-col sm:flex-row gap-4">
          <Input
            name="q"
            defaultValue={searchParams.q || ''}
            placeholder="Search action or entity..."
            className="sm:max-w-[200px]"
          />
          <Input
            name="entityType"
            defaultValue={searchParams.entityType || ''}
            placeholder="Entity Type (e.g., User)"
            className="sm:max-w-[180px]"
          />
          <Input
            name="actorId"
            defaultValue={searchParams.actorId || ''}
            placeholder="Actor ID"
            className="sm:max-w-[180px]"
          />
          <Button type="submit">Filter</Button>
          {(searchParams.q || searchParams.entityType || searchParams.actorId) && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/audit-logs">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      <AuditLogViewer logs={items as unknown as AuditLogRow[]} />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)}{' '}
          of {total} results
        </p>

        <div className="flex gap-2">
          {hasPrevPage && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPaginationUrl(page - 1)}>Previous</Link>
            </Button>
          )}
          {hasNextPage && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPaginationUrl(page + 1)}>Next</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
