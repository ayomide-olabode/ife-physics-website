import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PGStudyOptionFormClient } from '@/components/academics/PGStudyOptionFormClient';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function NewPGStudyOptionPage({ params }: PageProps) {
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
      <BackToParent
        href={`/dashboard/postgraduate/${programmeCode.toLowerCase()}/study-options`}
        label="Back to Study Options"
      />

      <PageHeader
        title={`New PG Study Option — ${programmeCode}`}
        description="Create a new study option for this postgraduate programme."
      />

      <PGStudyOptionFormClient programmeCode={programmeCode} />
    </div>
  );
}
