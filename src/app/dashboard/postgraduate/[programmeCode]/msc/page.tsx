import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProgrammeCode } from '@prisma/client';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function MScPage({ params }: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`M.Sc. Programme — ${programmeCode}`}
        description={`Manage the M.Sc. requirements and details for ${programmeCode}.`}
      />
      {/* TODO: Add M.Sc. specific content and requirement block editor */}
    </div>
  );
}
