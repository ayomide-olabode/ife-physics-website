import Link from 'next/link';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

type CompletenessResult = {
  isComplete: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  displayName?: string;
};

export function ProfileCompletenessCard({
  completeness,
  emphasizeRequired = false,
}: {
  completeness: CompletenessResult;
  emphasizeRequired?: boolean;
}) {
  const { isComplete, missingRequired, missingRecommended } = completeness;

  return (
    <div
      className={`rounded-lg border p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 ${
        isComplete
          ? 'bg-green-50/30 border-green-100 dark:bg-green-900/10 dark:border-green-900/40'
          : emphasizeRequired
            ? 'bg-red-50/50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'
            : 'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50'
      }`}
    >
      <div className="flex gap-4">
        <div className="mt-1">
          {isComplete ? (
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-500" />
          ) : (
            <ShieldAlert
              className={`h-6 w-6 ${
                emphasizeRequired
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-yellow-600 dark:text-yellow-500'
              }`}
            />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Profile Status:
            <span
              className={`text-sm px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                isComplete
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : emphasizeRequired
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}
            >
              {isComplete ? 'Complete' : 'Incomplete'}
            </span>
          </h3>

          {!isComplete && missingRequired.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium text-foreground">Required updates:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
                {missingRequired.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {(!isComplete || missingRecommended.length > 0) && missingRecommended.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium text-foreground">Recommended additions:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
                {missingRecommended.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {isComplete && missingRecommended.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Your profile is fully up to date. Excellent!
            </p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        {!isComplete || missingRecommended.length > 0 ? (
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Update profile
          </Link>
        ) : (
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            View profile
          </Link>
        )}
      </div>
    </div>
  );
}
