import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { Button } from '@/components/ui/button';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getStudyOptionByIdForProgramme } from '@/server/queries/undergraduateStudyOptions';
import { StudyOptionFormClient } from '@/components/academics/StudyOptionFormClient';
import { CourseMapper } from '@/components/academics/CourseMapper';
import { StudyOptionDeleteButton } from '@/components/academics/StudyOptionDeleteButton';

interface PageProps {
  params: Promise<{ programmeCode: string; id: string }>;
}

export default async function EditStudyOptionPage({ params }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;

  const studyOption = await getStudyOptionByIdForProgramme({
    programmeCode,
    id: resolvedParams.id,
  });

  if (!studyOption) {
    notFound();
  }

  const mappedCourses = studyOption.courses.map((c) => c.course);

  return (
    <div className="space-y-8">
      <BackToParent
        href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`}
        label="Back to Study Options"
      />

      <PageHeader
        title={`Edit Study Option — ${studyOption.name}`}
        description="Update the study option details and manage course mappings."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}`}>
                Back to Programme
              </Link>
            </Button>
            <StudyOptionDeleteButton programmeCode={programmeCode} studyOptionId={studyOption.id} />
          </>
        }
      />

      <StudyOptionFormClient
        programmeCode={programmeCode}
        initialData={{
          id: studyOption.id,
          name: studyOption.name,
          about: studyOption.about,
        }}
      />

      <div className="border-t pt-6">
        <CourseMapper
          programmeCode={programmeCode}
          studyOptionId={studyOption.id}
          mappedCourses={mappedCourses}
        />
      </div>
    </div>
  );
}
