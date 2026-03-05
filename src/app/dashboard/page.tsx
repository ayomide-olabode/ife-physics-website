import { auth } from '@/lib/auth';
import { getProfileCompleteness } from '@/server/queries/profileCompleteness';
import { ProfileCompletenessCard } from '@/components/dashboard/ProfileCompletenessCard';

export default async function DashboardPage() {
  const session = await auth();

  const completeness = session?.user?.staffId
    ? await getProfileCompleteness(session.user.staffId)
    : null;

  return (
    <div className="space-y-6">
      {completeness && <ProfileCompletenessCard completeness={completeness} />}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {session?.user.email || session?.user.staffId}.
        </p>
      </div>
    </div>
  );
}
