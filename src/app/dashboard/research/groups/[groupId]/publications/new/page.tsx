import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PublicationFormClient } from '@/components/research/PublicationFormClient';

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function NewPublicationPage({ params }: PageProps) {
  const { groupId } = await params;

  return (
    <div className="space-y-6">
      <BackToParent
        href={`/dashboard/research/groups/${groupId}/publications`}
        label="Publications"
      />

      <PageHeader title="New Publication" />

      <PublicationFormClient groupId={groupId} />
    </div>
  );
}
