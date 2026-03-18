import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { ProgrammeTabs } from '@/components/academics/ProgrammeTabs';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';
import { requireAcademicAccess } from '@/lib/guards';
import { getAccessibleProgrammesForLevel } from '@/lib/rbac';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ programmeCode: string }>;
}

export default async function UndergraduateProgrammeLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();

  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  const session = await requireAcademicAccess({ level: 'UNDERGRADUATE', programmeCode });
  const basePath = `/dashboard/undergraduate/${programmeCode.toLowerCase()}`;
  const accessibleProgrammes = await getAccessibleProgrammesForLevel(session, 'UNDERGRADUATE');
  const programmeTabs = accessibleProgrammes.map((code) => ({
    label:
      code === 'PHY'
        ? 'Physics'
        : code === 'EPH'
          ? 'Engineering Physics'
          : 'Science Laboratory Technology',
    href: `/dashboard/undergraduate/${code.toLowerCase()}/overview`,
  }));

  return (
    <div className="space-y-6">
      <ModuleTabs tabs={programmeTabs} />
      <ProgrammeTabs programmeCode={programmeCode} basePath={basePath} />
      {children}
    </div>
  );
}
