import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getPgDegreeContent } from '@/server/queries/pgDegreeContent';
import { PgDegreeContentEditor } from '@/components/academics/PgDegreeContentEditor';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function MscDegreePage({ params }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  const content = await getPgDegreeContent(programmeCode, 'MSC');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programmeCode} / M.Sc.`}
        description="Manage the academic requirements and content for the Master of Science programme."
      />

      <div className="rounded-lg border bg-card p-6">
        <PgDegreeContentEditor
          programmeCode={programmeCode}
          degreeType="MSC"
          initialData={content}
        />
      </div>
    </div>
  );
}
