import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode, CourseStatus } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { listPostgraduateCourses } from '@/server/queries/postgraduateCourses';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function PostgraduateCoursesPage({ params, searchParams }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;
  const code = programmeCode.toLowerCase();

  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || '';
  const status = resolvedSearchParams.status as CourseStatus | undefined;
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = 10;

  const { items, total } = await listPostgraduateCourses({
    programmeCode,
    q,
    status:
      status && Object.values(CourseStatus).includes(status as CourseStatus) ? status : undefined,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="text-sm border-b pb-2 mb-4">
        <Link
          href={`/dashboard/postgraduate/${code}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          &larr; Back to Programme
        </Link>
      </div>

      <PageHeader
        title={`PG Courses — ${programmeCode}`}
        description={`Manage the list of courses offered for the ${programmeCode} postgraduate programme.`}
        actions={
          <Button asChild>
            <Link href={`/dashboard/postgraduate/${code}/courses/new`}>Add New</Link>
          </Button>
        }
      />

      {/* Filters */}
      <form className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-1 w-full sm:w-64">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="Code or Title..." />
        </div>

        <div className="space-y-1 w-full sm:w-48">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select name="status" defaultValue={status || 'ALL'}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="CORE">CORE</SelectItem>
              <SelectItem value="RESTRICTED">RESTRICTED</SelectItem>
            </SelectContent>
          </Select>
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
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Units (L/T/P/U)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No courses found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>
                    <StatusBadge status={course.status === 'CORE' ? 'PUBLISHED' : 'DRAFT'} />
                  </TableCell>
                  <TableCell>
                    {course.L ?? '-'}/{course.T ?? '-'}/{course.P ?? '-'}/{course.U ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/postgraduate/${code}/courses/${course.id}`}>
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
              <Link href={`?q=${encodeURIComponent(q)}&status=${status || ''}&page=${page - 1}`}>
                Previous
              </Link>
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
              <Link href={`?q=${encodeURIComponent(q)}&status=${status || ''}&page=${page + 1}`}>
                Next
              </Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
