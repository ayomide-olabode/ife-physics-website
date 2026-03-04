import { PageHeader } from '@/components/dashboard/PageHeader';
import { CreateStaffForm } from '@/components/dashboard/CreateStaffForm';

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Staff"
        description="Create a new staff record and provision system access."
      />
      <div className="rounded-lg border p-8 bg-card">
        <CreateStaffForm />
      </div>
    </div>
  );
}
