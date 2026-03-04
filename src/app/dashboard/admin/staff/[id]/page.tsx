import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { getStaffById } from '@/server/queries/adminStaff';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { BackToParent } from '@/components/dashboard/BackToParent';

export default async function AdminStaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await getStaffById(id);

  if (!staff) {
    notFound();
  }

  const leadershipRows = staff.leadershipTerms.map((term) => [
    <span key="role" className="font-medium text-sm">
      {term.role}
    </span>,
    <span key="programme" className="text-sm">
      {term.programmeCode || '-'}
    </span>,
    <span key="start" className="text-sm">
      {new Date(term.startDate).toLocaleDateString()}
    </span>,
    <span key="end" className="text-sm">
      {term.endDate ? new Date(term.endDate).toLocaleDateString() : 'Present'}
    </span>,
  ]);

  const hasName = staff.firstName && staff.lastName;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <BackToParent href="/dashboard/admin/staff" label="Back to Staff" />
          <div className="flex items-center gap-3">
            <PageHeader
              title={hasName ? `${staff.firstName} ${staff.lastName}` : staff.institutionalEmail}
              description={hasName ? staff.institutionalEmail : undefined}
              actions={
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    staff.staffStatus === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                  }`}
                >
                  {staff.staffStatus.replace(/_/g, ' ')}
                </span>
              }
            />
            {!hasName && (
              <span className="inline-flex items-center rounded-sm bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive mt-1">
                PROFILE INCOMPLETE
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Staff Details</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Staff ID:</span>
              <span className="text-sm font-medium">{staff.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Type:</span>
              <span className="text-sm font-medium">{staff.staffType.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Record Created:</span>
              <span className="text-sm font-medium">
                {new Date(staff.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">User System Access</h3>
            {!staff.user && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/admin/users/new?staffId=${staff.id}`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create user shell
                </Link>
              </Button>
            )}
          </div>

          {staff.user ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Account Status:</span>
                <span className="text-sm font-medium">
                  {staff.user.passwordHash === '' ? (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                      INVITED
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                      ACTIVE
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Super Admin:</span>
                <span className="text-sm font-medium">
                  {staff.user.isSuperAdmin ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Last Login:</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {staff.user.lastLoginAt
                    ? new Date(staff.user.lastLoginAt).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No system user account has been provisioned for this staff record yet.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Leadership Terms</h2>
        <DataTable
          headers={['Role', 'Programme', 'Start Date', 'End Date']}
          rows={leadershipRows}
          emptyState={
            <EmptyState
              title="No leadership terms"
              description="This staff member has no leadership terms recorded."
            />
          }
        />
      </div>
    </div>
  );
}
