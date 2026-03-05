import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DataTable } from '@/components/dashboard/DataTable';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { listUsers } from '@/server/queries/adminUsers';
import { Button } from '@/components/ui/button';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = parseInt(params.pageSize || '20', 10);

  const { items: users, total } = await listUsers({ q, page, pageSize });

  const hasNextPage = page * pageSize < total;
  const hasPrevPage = page > 1;

  const rows = users.map((user) => {
    const activeRoles = user.roleAssignments
      ? user.roleAssignments
          .filter((ra) => !ra.expiresAt || new Date(ra.expiresAt) > new Date())
          .map((ra) => ra.role)
      : [];
    const uniqueRoles = Array.from(new Set(activeRoles));

    return [
      <span key="staffId" className="text-sm font-medium">
        {user.staffId}
      </span>,
      <div key="name" className="text-sm">
        {user.staff.firstName} {user.staff.lastName}
      </div>,
      <div key="email" className="text-sm text-muted-foreground">
        {user.staff.institutionalEmail}
      </div>,
      <span key="account" className="text-sm">
        {user.passwordHash === '' ? (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
            INVITED
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
            ACTIVE
          </span>
        )}
      </span>,
      <span key="roles" className="text-sm flex flex-wrap gap-1">
        {user.isSuperAdmin && (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-500">
            SUPER_ADMIN
          </span>
        )}
        {uniqueRoles.includes('EDITOR') && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-500">
            EDITOR
          </span>
        )}
        {uniqueRoles.includes('ACADEMIC_COORDINATOR') && (
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-500">
            ACADEMIC_COORDINATOR
          </span>
        )}
        {uniqueRoles.includes('RESEARCH_LEAD') && (
          <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/30 dark:text-teal-500">
            RESEARCH_LEAD
          </span>
        )}
        {!user.isSuperAdmin && uniqueRoles.length === 0 && (
          <span className="text-muted-foreground">-</span>
        )}
      </span>,
      <span key="joined" className="text-sm">
        {new Date(user.createdAt).toLocaleDateString()}
      </span>,
      <span key="lastLogin" className="text-sm">
        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
      </span>,
      <Link
        key="actions"
        href={`/dashboard/admin/users/${user.id}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        View Details
      </Link>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system users and their roles."
        actions={
          <div className="flex items-center gap-4">
            <form method="GET" action="/dashboard/admin/users" className="flex items-center gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search users..."
                className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
            <AddNewButton href="/dashboard/admin/users/new" />
          </div>
        }
      />
      <DataTable
        headers={[
          'Staff ID',
          'Name',
          'Email',
          'Account',
          'Roles',
          'Joined',
          'Last Login',
          'Actions',
        ]}
        rows={rows}
        emptyState={
          <EmptyState
            title="No users yet"
            description={q ? `No users matched "${q}".` : 'Add a user to get started.'}
          />
        }
        footer={
          total > pageSize ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                users
              </div>
              <div className="flex gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`/dashboard/admin/users?page=${page - 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-md border px-3 py-1 opacity-50 cursor-not-allowed">
                    Previous
                  </span>
                )}
                {hasNextPage ? (
                  <Link
                    href={`/dashboard/admin/users?page=${page + 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-md border px-3 py-1 opacity-50 cursor-not-allowed">
                    Next
                  </span>
                )}
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}
