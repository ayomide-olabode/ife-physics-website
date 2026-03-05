import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode, DegreeType } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { listRequirementBlocks } from '@/server/queries/pgRequirementBlocks';
import { PgReqBlockListClient } from '@/components/academics/PgReqBlockListClient';

const VALID_LEVELS: Record<string, DegreeType> = {
  msc: 'MSC',
  mphil: 'MPHIL',
  phd: 'PHD',
};

const LEVEL_LABELS: Record<string, string> = {
  msc: 'M.Sc.',
  mphil: 'M.Phil.',
  phd: 'Ph.D.',
};

interface PageProps {
  params: Promise<{ programmeCode: string; level: string }>;
}

export default async function RequirementBlocksPage({ params }: PageProps) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;

  const levelStr = resolvedParams.level.toLowerCase();
  const degreeType = VALID_LEVELS[levelStr];
  if (!degreeType) {
    notFound();
  }

  const { items, total } = await listRequirementBlocks({
    programmeCode,
    degreeType,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div className="text-sm border-b pb-2 mb-4">
        <Link
          href={`/dashboard/postgraduate/${programmeCode.toLowerCase()}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          &larr; Back to Programme
        </Link>
      </div>

      <PageHeader
        title={`Requirement Blocks — ${programmeCode} (${LEVEL_LABELS[levelStr]})`}
        description={`Manage admission and course requirement blocks for ${LEVEL_LABELS[levelStr]} in ${programmeCode}.`}
      />

      <PgReqBlockListClient
        programmeCode={programmeCode}
        degreeType={degreeType}
        items={items}
        total={total}
      />
    </div>
  );
}
