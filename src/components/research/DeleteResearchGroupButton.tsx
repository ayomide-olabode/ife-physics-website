'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { toastError, toastSuccess } from '@/lib/toast';
import { deleteResearchGroup } from '@/server/actions/researchGroups';

export function DeleteResearchGroupButton({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    const result = await deleteResearchGroup(groupId);

    if (!result.success) {
      toastError(result.error || 'Failed to delete research group.');
      throw new Error(result.error || 'Delete failed');
    }

    toastSuccess('Research group deleted.');
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-base font-medium text-destructive hover:text-red-800"
      >
        Delete
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete research group?"
        description={`This will remove "${groupName}" from dashboard and public listings. This action cannot be undone.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
