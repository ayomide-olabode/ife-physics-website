import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProgrammeCode } from '@prisma/client';

interface PageProps {
  params: Promise<{
    programmeCode: string;
  }>;
}

export default async function UndergraduateRequirementsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const programmeCode = resolvedParams.programmeCode.toUpperCase() as ProgrammeCode;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programmeCode} / Requirements`}
        description={`Manage admission and graduation requirements for the ${programmeCode} undergraduate programme.`}
      />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-sm">
          Requirements editor will be implemented here.
        </p>
      </div>
    </div>
  );
}
