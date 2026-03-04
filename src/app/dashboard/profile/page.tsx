import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm';
import { redirect } from 'next/navigation';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId) {
    redirect('/login');
  }

  // Find their user mapping, then jump into the Staff mapping
  const user = await prisma.user.findUnique({
    where: { id: session.user.userId },
    include: { staff: true },
  });

  if (!user || !user.staff) {
    return (
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <p className="text-muted-foreground">
          Error: No underlying staff record located for this account.
        </p>
      </main>
    );
  }

  const staff = user.staff;
  const params = await searchParams;
  const showOnboarding = params.onboarding === '1';

  return (
    <main className="container mx-auto px-4 py-12 space-y-8 max-w-4xl">
      {showOnboarding && (
        <div className="rounded-md bg-blue-50/50 p-4 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-800 dark:text-blue-300">
          <p className="text-sm font-medium">
            Welcome! Please take a moment to complete your profile identity to proceed securely.
          </p>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your foundational registry details.</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Identity Details</h2>
        <EditProfileForm
          staffId={staff.id}
          initialFirstName={staff.firstName}
          initialLastName={staff.lastName}
        />
      </div>
    </main>
  );
}
