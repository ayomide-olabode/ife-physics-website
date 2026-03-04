import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { CreateUserForm } from '@/components/dashboard/CreateUserForm';

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/dashboard/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <PageHeader
          title="Create User"
          description="Provision a new user account linked to an existing staff record."
          actions={
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/admin/staff/new">
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Staff
              </Link>
            </Button>
          }
        />
      </div>

      <CreateUserForm />
    </div>
  );
}
