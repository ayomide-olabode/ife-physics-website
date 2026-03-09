import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProgrammeCode } from '@prisma/client';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function PhDPage({ params }: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ph.D. Programme — ${programmeCode}`}
        description={`Manage the Ph.D. requirements and details for ${programmeCode}.`}
      />
      {/* TODO: Add Ph.D. specific content and requirement block editor */}
    </div>
  );
}
