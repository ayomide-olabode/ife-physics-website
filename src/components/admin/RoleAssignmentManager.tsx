'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignRole, revokeRole } from '@/server/actions/roleAssignments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { toastSuccess, toastError } from '@/lib/toast';
import { ScopedRole } from '@prisma/client';

type Assignment = {
  id: string;
  role: string;
  scopeType: string;
  scopeId: string | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
};

export function RoleAssignmentManager({
  userId,
  assignments,
}: {
  userId: string;
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [role, setRole] = useState<ScopedRole | ''>('');
  const [scopeId, setScopeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revoke state
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toastError('Please select a role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignRole({
        userId,
        role,
        scopeId: role === 'RESEARCH_LEAD' ? scopeId : null,
      });

      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Role assigned successfully.');
        setRole('');
        setScopeId('');
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    try {
      const res = await revokeRole({ roleAssignmentId: revokeId });
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Role revoked successfully.');
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      toastError('Failed to revoke role.');
    }
  };

  const roleRows = assignments.map((ra) => [
    <span key="role" className="font-medium text-sm">
      {ra.role}
    </span>,
    <span key="scope" className="text-sm">
      {ra.scopeType} {ra.scopeId ? `(${ra.scopeId})` : ''}
    </span>,
    <span key="status" className="text-sm">
      {ra.deletedAt ? (
        <span className="text-red-600">Deleted</span>
      ) : ra.expiresAt && new Date(ra.expiresAt) < new Date() ? (
        <span className="text-yellow-600">Expired</span>
      ) : (
        <span className="text-green-600">Active</span>
      )}
    </span>,
    <span key="expires" className="text-sm text-muted-foreground">
      {ra.expiresAt ? new Date(ra.expiresAt).toLocaleDateString() : 'Never'}
    </span>,
    <span key="actions">
      {!ra.deletedAt && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setRevokeId(ra.id)}
          disabled={isPending}
        >
          Revoke
        </Button>
      )}
    </span>,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Assign Form */}
        <div className="md:col-span-1 rounded-lg border p-4 bg-card">
          <h3 className="text-lg font-semibold mb-4">Assign Role</h3>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as ScopedRole)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>
                  Select a role...
                </option>
                <option value="EDITOR">EDITOR (Global)</option>
                <option value="ACADEMIC_COORDINATOR">ACADEMIC_COORDINATOR (Global)</option>
                <option value="RESEARCH_LEAD">RESEARCH_LEAD (Scoped)</option>
              </select>
            </div>

            {role === 'RESEARCH_LEAD' && (
              <div className="space-y-2">
                <Label htmlFor="scopeId">Research Group ID</Label>
                <Input
                  id="scopeId"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  placeholder="Paste ResearchGroup.id"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste ResearchGroup.id (will be selectable later in Research module)
                </p>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting || isPending} className="w-full">
              {isSubmitting ? 'Assigning...' : 'Assign Role'}
            </Button>
          </form>
        </div>

        {/* Assignments Table */}
        <div className="md:col-span-2 space-y-4">
          <DataTable
            headers={['Role', 'Scope', 'Status', 'Expires At', 'Actions']}
            rows={roleRows}
            emptyState={
              <EmptyState
                title="No roles"
                description="This user has no mapped role assignments."
              />
            }
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!revokeId}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
        title="Revoke Role Assignment"
        description="Are you sure you want to revoke this role? The user will lose associated permissions immediately."
        confirmText="Revoke"
        cancelText="Cancel"
        onConfirm={handleRevoke}
        destructive
      />
    </div>
  );
}
