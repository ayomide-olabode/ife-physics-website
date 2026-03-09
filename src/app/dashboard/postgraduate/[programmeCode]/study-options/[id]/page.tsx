import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ programmeCode: string; id: string }>;
}

export default async function StudyOptionDetailRedirectPage({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(`/dashboard/postgraduate/${resolvedParams.programmeCode}/overview`);
}
