'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/lib/toast';
import { deletePostgraduateStudyOption } from '@/server/actions/postgraduateStudyOptions';

interface Props {
  programmeCode: ProgrammeCode;
  studyOptionId: string;
}

export function PGStudyOptionDeleteButton({ programmeCode, studyOptionId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await deletePostgraduateStudyOption(programmeCode, studyOptionId);
        if (res.success) {
          toastSuccess('Study option deleted.');
          router.push(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/study-options`);
        } else {
          toastError(res.error || 'Failed to delete.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      } finally {
        setConfirming(false);
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
          {isPending ? 'Deleting…' : 'Confirm Delete'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
