import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getCourseForProgramme } from '@/server/queries/undergraduateCourses';
import { CourseFormClient } from '@/components/academics/CourseFormClient';

interface PageProps {
  params: Promise<{
    programmeCode: string;
    id: string;
  }>;
}

export default async function EditCoursePage({ params }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;

  const course = await getCourseForProgramme({
    programmeCode,
    id: resolvedParams.id,
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BackToParent
        href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}/courses`}
        label="Back to Courses"
      />

      <PageHeader
        title={`Edit Course — ${course.code}`}
        description={`Edit the details for ${course.code}: ${course.title}.`}
      />

      <CourseFormClient programmeCode={programmeCode} initialData={course} />
    </div>
  );
}
