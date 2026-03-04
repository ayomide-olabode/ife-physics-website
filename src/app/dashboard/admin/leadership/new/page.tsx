import { PageHeader } from '@/components/dashboard/PageHeader';
import { CreateLeadershipTermForm } from '@/components/admin/CreateLeadershipTermForm';
import { BackToParent } from '@/components/dashboard/BackToParent';

export default function NewLeadershipTermPage() {
  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/admin/leadership" label="Back to Leadership" />
      <PageHeader
        title="Assign Leadership Term"
        description="Designate a Head of Department or Academic Coordinator. HOD roles check against active conflicts automatically."
      />

      <div className="max-w-3xl">
        <CreateLeadershipTermForm />
      </div>
    </div>
  );
}
