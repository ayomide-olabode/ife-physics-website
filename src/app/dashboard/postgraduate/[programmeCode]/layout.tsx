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

export default async function ProgrammeLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();

  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  const session = await requireAcademicAccess({ level: 'POSTGRADUATE', programmeCode });
  const code = codeStr.toLowerCase();
  const accessibleProgrammes = await getAccessibleProgrammesForLevel(session, 'POSTGRADUATE');

  return (
    <>
      <ProgrammeTabs
        programmeCode={programmeCode}
        basePath={`/dashboard/postgraduate/${code}`}
        level="POSTGRADUATE"
        allowedProgrammeCodes={accessibleProgrammes}
        showSectionTabs={false}
      />
      <ModuleTabs
        tabs={[
          { label: 'Overview', href: `/dashboard/postgraduate/${code}/overview` },
          { label: 'M.Sc.', href: `/dashboard/postgraduate/${code}/msc` },
          { label: 'M.Phil.', href: `/dashboard/postgraduate/${code}/mphil` },
          { label: 'Ph.D.', href: `/dashboard/postgraduate/${code}/phd` },
          { label: 'Courses', href: `/dashboard/postgraduate/${code}/courses` },
        ]}
      />
      {children}
    </>
  );
}
