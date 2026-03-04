import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and permissions."
        actions={<Button>Add User</Button>}
      />
      <DataTable
        headers={['Name', 'Email', 'Role', 'Status', 'Actions']}
        rows={[]}
        emptyState={
          <EmptyState
            title="No users found"
            description="There are currently no users registered in the system."
            action={<Button variant="outline">Import Users</Button>}
          />
        }
      />
    </div>
  );
}
