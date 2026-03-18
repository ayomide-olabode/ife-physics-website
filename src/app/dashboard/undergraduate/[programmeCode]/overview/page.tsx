import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAcademicAccess } from '@/lib/guards';
import { getUndergraduateProgram } from '@/server/queries/undergraduateProgram';
import { UndergraduateOverviewEditor } from '@/components/academics/ug/UndergraduateOverviewEditor';
import { listStudyOptions } from '@/server/queries/undergraduateStudyOptions';
import { StudyOptionsInlineEditor } from '@/components/academics/study-options/StudyOptionsInlineEditor';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function UndergraduateProgrammeOverviewPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'UNDERGRADUATE', programmeCode });

  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || '';
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  // Initialize both the program specifics and the study options list
  const [programData, studyOptionsList] = await Promise.all([
    getUndergraduateProgram(programmeCode),
    listStudyOptions({ programmeCode, q, page, pageSize: 50 }),
  ]);

  const initialOptions = studyOptionsList.items.map((i) => ({ id: i.id, name: i.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programmeCode} / Overview`}
        description={`Manage the content sections and study options mapped for the ${programmeCode} undergraduate programme.`}
      />

      <div className="rounded-lg border bg-card p-6">
        <UndergraduateOverviewEditor programmeCode={programmeCode} initialData={programData} />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <StudyOptionsInlineEditor
          programmeCode={programmeCode}
          level="UNDERGRADUATE"
          initialOptions={initialOptions}
        />
      </div>
    </div>
  );
}
