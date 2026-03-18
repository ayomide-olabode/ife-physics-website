import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { ProgrammeTabs } from '@/components/academics/ProgrammeTabs';
import { requireAcademicAccess } from '@/lib/guards';

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
  await requireAcademicAccess({ level: 'UNDERGRADUATE', programmeCode });
  const basePath = `/dashboard/undergraduate/${programmeCode.toLowerCase()}`;

  return (
    <div className="space-y-6">
      <ProgrammeTabs programmeCode={programmeCode} basePath={basePath} />
      {children}
    </div>
  );
}
