export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const params = await searchParams;
  const showOnboarding = params.onboarding === '1';

  return (
    <main className="container mx-auto px-4 py-12 space-y-6">
      {showOnboarding && (
        <div className="rounded-md bg-blue-50/50 p-4 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-800 dark:text-blue-300">
          <p className="text-sm font-medium">Welcome — please complete your profile.</p>
        </div>
      )}
      <h1 className="text-3xl font-bold">My Profile</h1>
    </main>
  );
}
