import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getPostgraduateProgram } from '@/server/queries/postgraduateProgram';
import { PostgraduateProgramEditor } from '@/components/academics/PostgraduateProgramEditor';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function PostgraduateProgrammeEditorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  const programData = await getPostgraduateProgram(programmeCode);

  const code = programmeCode.toLowerCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Postgraduate — ${programmeCode}`}
        description={`Manage the content sections for the ${programmeCode} postgraduate programme.`}
      />

      <PostgraduateProgramEditor programmeCode={programmeCode} initialData={programData} />

      {/* Related Pages */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Course &amp; Study Options Management</h2>
        <p className="text-sm text-muted-foreground">
          Courses, study options, and requirement blocks are managed separately.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/dashboard/postgraduate/${code}/courses`}>Manage Courses</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/postgraduate/${code}/courses/new`}>Create New Course</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/dashboard/postgraduate/${code}/study-options`}>Manage Study Options</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Requirement Blocks</h2>
        <p className="text-sm text-muted-foreground">
          Manage admission and course requirements per degree level.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" asChild>
            <Link href={`/dashboard/postgraduate/${code}/msc/requirement-blocks`}>
              M.Sc. Requirements
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/dashboard/postgraduate/${code}/mphil/requirement-blocks`}>
              M.Phil. Requirements
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/dashboard/postgraduate/${code}/phd/requirement-blocks`}>
              Ph.D. Requirements
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
