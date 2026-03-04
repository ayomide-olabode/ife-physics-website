import { auth } from '@/lib/auth';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {session?.user.email || session?.user.staffId}.
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
