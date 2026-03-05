import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getMyHodAddress } from '@/server/queries/profileHodAddress';
import { HodAddressClientForm } from '@/components/profile/HodAddressClientForm';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';

export default async function Page() {
  const session = await requireAuth();
  const staffId = session.user?.staffId;

  if (!staffId) {
    notFound();
  }

  const isHod = await prisma.leadershipTerm.findFirst({
    where: {
      staffId,
      role: 'HOD',
      endDate: null,
    },
  });

  if (!isHod) {
    notFound();
  }

  const existingData = await getMyHodAddress(staffId);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/profile" label="Back to Profile" />
      <PageHeader
        title="HOD Address"
        description="Manage the Head of Department welcome address displayed on the homepage securely."
      />
      <div className="rounded-lg border bg-card p-6">
        <HodAddressClientForm initialTitle={existingData?.title} initialBody={existingData?.body} />
      </div>
    </div>
  );
}
