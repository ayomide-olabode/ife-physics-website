'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { updateUserSuperAdmin } from '@/server/actions/adminUsers';
import { toastError, toastSuccess } from '@/lib/toast';

type SuperAdminAssignmentManagerProps = {
  userId: string;
  isSuperAdmin: boolean;
  canManage?: boolean;
};

export function SuperAdminAssignmentManager({
  userId,
  isSuperAdmin,
  canManage = true,
}: SuperAdminAssignmentManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const targetIsSuperAdmin = !isSuperAdmin;

  async function handleConfirm() {
    try {
      const result = await updateUserSuperAdmin({
        userId,
        isSuperAdmin: targetIsSuperAdmin,
      });

      if (result.error) {
        toastError(result.error);
        return;
      }

      if (targetIsSuperAdmin) {
        toastSuccess('Super Admin access granted.');
      } else {
        toastSuccess('Super Admin access removed.');
      }

      setOpen(false);
      router.refresh();
    } catch {
      toastError('An unexpected error occurred while updating super admin access.');
    }
  }

  return (
    <>
      <div className="rounded-lg border p-4">
        <h3 className="text-base font-medium text-muted-foreground">Super Admin Assignment</h3>
        <p className="text-base mt-2">
          Current status:{' '}
          <span className="font-medium">{isSuperAdmin ? 'Super Admin' : 'Standard User'}</span>
        </p>
        <p className="text-base text-muted-foreground mt-2">
          Only existing Super Admins can grant or revoke this access. The system always keeps at
          least one Super Admin.
        </p>
        {!canManage ? (
          <p className="text-base text-muted-foreground mt-2">
            You cannot change your own Super Admin assignment from this page.
          </p>
        ) : null}
        <div className="mt-4">
          <Button
            type="button"
            variant={isSuperAdmin ? 'destructive' : 'default'}
            onClick={() => setOpen(true)}
            disabled={!canManage}
          >
            {isSuperAdmin ? 'Remove Super Admin' : 'Grant Super Admin'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={targetIsSuperAdmin ? 'Grant Super Admin access?' : 'Remove Super Admin access?'}
        description={
          targetIsSuperAdmin
            ? 'This will grant unrestricted system access to this user.'
            : 'This will remove unrestricted system access from this user.'
        }
        onConfirm={handleConfirm}
        destructive={isSuperAdmin}
      />
    </>
  );
}
