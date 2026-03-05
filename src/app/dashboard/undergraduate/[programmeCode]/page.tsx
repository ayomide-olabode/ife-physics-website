import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getUndergraduateProgram } from '@/server/queries/undergraduateProgram';
import { UndergraduateProgramEditor } from '@/components/academics/UndergraduateProgramEditor';

interface PageProps {
  params: Promise<{
    programmeCode: string;
  }>;
}

export default async function UndergraduateProgrammeEditorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  const programData = await getUndergraduateProgram(programmeCode);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Undergraduate — ${programmeCode}`}
        description={`Manage the content sections for the ${programmeCode} undergraduate programme.`}
      />

      <UndergraduateProgramEditor programmeCode={programmeCode} initialData={programData} />

      {/* Related Pages */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Course &amp; Study Options Management</h2>
        <p className="text-sm text-muted-foreground">
          Courses and study options are managed separately. Add or edit details using the links
          below.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}/courses`}>
              Manage Courses
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}/courses/new`}>
              Create New Course
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`}>
              Manage Study Options
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
