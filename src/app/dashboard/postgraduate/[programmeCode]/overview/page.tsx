import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getPostgraduateProgram } from '@/server/queries/postgraduateProgram';
import { PostgraduateProgramEditor } from '@/components/academics/PostgraduateProgramEditor';
import { PGStudyOptionsPanel } from '@/components/academics/PGStudyOptionsPanel';
import { listPostgraduateStudyOptions } from '@/server/queries/postgraduateStudyOptions';
import { getProgramStudyOptionById } from '@/server/queries/programStudyOptions';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
  searchParams: Promise<{ q?: string; page?: string; studyOptionId?: string }>;
}

export default async function PostgraduateProgrammeOverviewPage({
  params,
  searchParams,
}: PageProps) {
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
  const studyOptionId = resolvedSearchParams.studyOptionId;

  // Concurrent data fetching
  const [programData, studyOptionsList] = await Promise.all([
    getPostgraduateProgram(programmeCode),
    listPostgraduateStudyOptions({ programmeCode, q, page, pageSize: 10 }),
  ]);

  let selectedOptionData = null;
  if (studyOptionId) {
    const programStudyOption = await getProgramStudyOptionById({
      programmeCode,
      id: studyOptionId,
      level: 'POSTGRADUATE',
    });

    if (programStudyOption && programStudyOption.studyOption) {
      selectedOptionData = {
        programStudyOptionId: programStudyOption.id,
        id: programStudyOption.studyOption.id,
        name: programStudyOption.studyOption.name,
        about: programStudyOption.studyOption.about,
        mappedCourses: programStudyOption.studyOption.courses.map((c) => c.course),
      };
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Postgraduate — ${programmeCode} / Overview`}
        description={`Manage the content sections and study options mapped for the ${programmeCode} postgraduate programme.`}
      />

      <div className="rounded-lg border bg-card p-6">
        <PostgraduateProgramEditor programmeCode={programmeCode} initialData={programData} />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <PGStudyOptionsPanel
          programmeCode={programmeCode}
          listData={studyOptionsList}
          selectedOptionData={selectedOptionData}
          q={q}
        />
      </div>
    </div>
  );
}
