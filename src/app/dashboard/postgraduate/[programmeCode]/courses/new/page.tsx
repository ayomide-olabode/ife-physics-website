import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PGCourseFormClient } from '@/components/academics/PGCourseFormClient';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function NewPGCoursePage({ params }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;

  return (
    <div className="space-y-6">
      <div className="text-sm border-b pb-2 mb-4">
        <Link
          href={`/dashboard/postgraduate/${programmeCode.toLowerCase()}/courses`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          &larr; Back to Courses
        </Link>
      </div>

      <PageHeader
        title={`New PG Course — ${programmeCode}`}
        description="Create a new course for this postgraduate programme."
      />

      <PGCourseFormClient programmeCode={programmeCode} />
    </div>
  );
}
