import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { listProgramStudyOptions } from '@/server/queries/programStudyOptions';
import { StudyOptionLinkModal } from '@/components/academics/StudyOptionLinkModal';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function StudyOptionsIndexPage({ params, searchParams }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;

  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || '';
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = 10;

  const { items, total } = await listProgramStudyOptions({ programmeCode, q, page, pageSize });
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="text-sm border-b pb-2 mb-4">
        <Link
          href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          &larr; Back to Programme
        </Link>
      </div>

      <PageHeader
        title={`Study Options — ${programmeCode}`}
        description={`Manage study options for the ${programmeCode} undergraduate programme.`}
        actions={<StudyOptionLinkModal programmeCode={programmeCode} level="UNDERGRADUATE" />}
      />

      {/* Filter */}
      <form className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-1 w-full sm:w-64">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="Name..." />
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      {/* Data Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  No study options found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.studyOption.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options/${item.id}`}
                      >
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            asChild={page < totalPages}
          >
            {page < totalPages ? (
              <Link href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
