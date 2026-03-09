import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function StudyOptionsRedirectPage({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(`/dashboard/postgraduate/${resolvedParams.programmeCode}/overview`);
}
