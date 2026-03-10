import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getPostgraduateProgram } from '@/server/queries/postgraduateProgram';
import { PostgraduateProgramEditor } from '@/components/academics/PostgraduateProgramEditor';
import { listPostgraduateStudyOptions } from '@/server/queries/postgraduateStudyOptions';
import { StudyOptionsInlineEditor } from '@/components/academics/study-options/StudyOptionsInlineEditor';

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

  // Initial fetch for the left sidebar purely: 50 should be enough for any programme realistically
  const [programData, studyOptionsList] = await Promise.all([
    getPostgraduateProgram(programmeCode),
    listPostgraduateStudyOptions({ programmeCode, q, page, pageSize: 50 }),
  ]);

  const initialOptions = studyOptionsList.items.map((i) => ({ id: i.id, name: i.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programmeCode} / Overview`}
        description={`Manage the content sections and study options mapped for the ${programmeCode} postgraduate programme.`}
      />

      <div className="rounded-lg border bg-card p-6">
        <PostgraduateProgramEditor programmeCode={programmeCode} initialData={programData} />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <StudyOptionsInlineEditor
          programmeCode={programmeCode}
          level="POSTGRADUATE"
          initialOptions={initialOptions}
        />
      </div>
    </div>
  );
}
