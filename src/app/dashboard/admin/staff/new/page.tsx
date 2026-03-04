import { PageHeader } from '@/components/dashboard/PageHeader';

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add New Staff" description="Create a new staff record." />
      <div className="rounded-lg border p-8 bg-card text-center text-muted-foreground">
        Staff creation form will be implemented here.
      </div>
    </div>
  );
}
