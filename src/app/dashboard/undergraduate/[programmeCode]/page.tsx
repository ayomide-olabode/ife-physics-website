import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
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
    </div>
  );
}
