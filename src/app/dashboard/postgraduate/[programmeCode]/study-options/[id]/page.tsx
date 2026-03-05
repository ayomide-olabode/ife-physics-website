import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getPostgraduateStudyOptionById } from '@/server/queries/postgraduateStudyOptions';
import { PGStudyOptionFormClient } from '@/components/academics/PGStudyOptionFormClient';
import { PGCourseMapper } from '@/components/academics/PGCourseMapper';
import { PGStudyOptionDeleteButton } from '@/components/academics/PGStudyOptionDeleteButton';

interface PageProps {
  params: Promise<{ programmeCode: string; id: string }>;
}

export default async function EditPGStudyOptionPage({ params }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;
  const code = programmeCode.toLowerCase();

  const studyOption = await getPostgraduateStudyOptionById({
    programmeCode,
    id: resolvedParams.id,
  });

  if (!studyOption) {
    notFound();
  }

  const mappedCourses = studyOption.courses.map((c) => c.course);

  return (
    <div className="space-y-8">
      <div className="text-sm border-b pb-2 mb-4 flex items-center justify-between">
        <Link
          href={`/dashboard/postgraduate/${code}/study-options`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          &larr; Back to Study Options
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/postgraduate/${code}`}>Back to Programme</Link>
        </Button>
      </div>

      <PageHeader
        title={`Edit PG Study Option — ${studyOption.name}`}
        description="Update the study option details and manage course mappings."
        actions={
          <PGStudyOptionDeleteButton programmeCode={programmeCode} studyOptionId={studyOption.id} />
        }
      />

      <PGStudyOptionFormClient
        programmeCode={programmeCode}
        initialData={{
          id: studyOption.id,
          name: studyOption.name,
          about: studyOption.about,
        }}
      />

      <div className="border-t pt-6">
        <PGCourseMapper
          programmeCode={programmeCode}
          studyOptionId={studyOption.id}
          mappedCourses={mappedCourses}
        />
      </div>
    </div>
  );
}
