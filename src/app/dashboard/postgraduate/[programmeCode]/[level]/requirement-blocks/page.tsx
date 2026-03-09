import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ programmeCode: string; level: string }>;
}

export default async function RequirementBlocksRedirectPage({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(`/dashboard/postgraduate/${resolvedParams.programmeCode}/${resolvedParams.level}`);
}
