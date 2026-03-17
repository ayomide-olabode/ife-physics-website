import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm';
import { AvatarUpload } from '@/components/dashboard/AvatarUpload';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getProfileCompleteness } from '@/server/queries/profileCompleteness';
import { ProfileCompletenessCard } from '@/components/dashboard/ProfileCompletenessCard';
import { ResearchGroupMembershipForm } from '@/components/profile/ResearchGroupMembershipForm';
import { listResearchGroupOptions } from '@/server/queries/researchGroupOptions';
import {
  getMySecondaryAffiliation,
  listSecondaryAffiliationOptions,
} from '@/server/queries/profileSecondaryAffiliation';
import { SecondaryAffiliationSelector } from '@/components/profile/SecondaryAffiliationSelector';

export default async function ProfileOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await requireAuth();

  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <main className="container mx-auto px-4 py-12">
        <PageHeader title="My Profile" />
        <p className="text-muted-foreground mt-4">
          Error: No underlying staff record located for this account.
        </p>
      </main>
    );
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      title: true,
      academicRank: true,
      designation: true,
      profileImageUrl: true,
      researchMemberships: {
        select: {
          researchGroupId: true,
        },
        take: 1,
      },
    },
  });

  if (!staff) {
    return (
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <p className="text-muted-foreground">
          Error: No underlying staff record located for this account.
        </p>
      </main>
    );
  }

  const params = await searchParams;
  const showOnboarding = params.onboarding === '1';

  const completeness = await getProfileCompleteness(staffId);
  const options = await listResearchGroupOptions();
  const currentGroupId = staff.researchMemberships[0]?.researchGroupId || null;
  const secondaryAffiliationOptions = await listSecondaryAffiliationOptions();
  const currentSecondaryAffiliation = await getMySecondaryAffiliation(staffId);

  return (
    <main className="container mx-auto px-4 py-12 space-y-8 max-w-4xl">
      {showOnboarding && (
        <div className="rounded-md bg-blue-50/50 p-4 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-800 dark:text-blue-300">
          <p className="text-sm font-medium">
            Welcome! Please take a moment to complete your profile identity to proceed securely.
          </p>
        </div>
      )}

      {!completeness.isComplete && (
        <ProfileCompletenessCard completeness={completeness} emphasizeRequired={showOnboarding} />
      )}

      <div>
        <PageHeader title="My Profile" description="Manage your foundational registry details." />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Profile Image</h2>
        <AvatarUpload
          currentImageUrl={staff.profileImageUrl}
          fallbackText={staff.firstName?.[0] || 'S'}
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">
          Personal &amp; Appointment Details
        </h2>
        <EditProfileForm
          initialTitle={staff.title}
          initialFirstName={staff.firstName}
          initialMiddleName={staff.middleName}
          initialLastName={staff.lastName}
          initialAcademicRank={staff.academicRank}
          initialDesignation={staff.designation}
        />
      </div>

      <div className="rounded-none border bg-card p-6">
        <div className="mb-6 border-b pb-2">
          <h2 className="text-xl font-semibold">Secondary Affiliation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Optional — select a centre/unit you&apos;re affiliated with.
          </p>
        </div>
        <SecondaryAffiliationSelector
          initialSecondaryAffiliationId={
            currentSecondaryAffiliation?.secondaryAffiliationId ?? null
          }
          options={secondaryAffiliationOptions}
        />
      </div>

      <ResearchGroupMembershipForm initialGroupId={currentGroupId} options={options} />
    </main>
  );
}
