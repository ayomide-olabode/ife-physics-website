'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode, DegreeType, RequirementType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { toastSuccess, toastError } from '@/lib/toast';
import {
  createRequirementBlock,
  updateRequirementBlock,
  deleteRequirementBlock,
} from '@/server/actions/pgRequirementBlocks';

export type ReqBlockFormData = {
  id?: string;
  title: string;
  requirementType: RequirementType;
  orderIndex: number;
  contentHtml: string;
};

interface Props {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  initialData?: ReqBlockFormData;
  onClose: () => void;
}

export function PgRequirementBlockEditor({
  programmeCode,
  degreeType,
  initialData,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title || '');
  const [requirementType, setRequirementType] = useState<RequirementType>(
    initialData?.requirementType || 'ADMISSION',
  );
  const [orderIndex, setOrderIndex] = useState(initialData?.orderIndex ?? 0);
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml || '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = { title, requirementType, orderIndex, contentHtml };
        const res = isEditing
          ? await updateRequirementBlock(programmeCode, degreeType, initialData!.id!, payload)
          : await createRequirementBlock(programmeCode, degreeType, payload);

        if (res.success) {
          toastSuccess(isEditing ? 'Block updated.' : 'Block created.');
          router.refresh();
          onClose();
        } else {
          toastError(res.error || 'Something went wrong.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <h3 className="text-lg font-semibold">{isEditing ? 'Edit Block' : 'New Block'}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rb-title">Title *</Label>
            <Input
              id="rb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Block title"
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb-type">Type *</Label>
            <Select
              value={requirementType}
              onValueChange={(v) => setRequirementType(v as RequirementType)}
            >
              <SelectTrigger id="rb-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMISSION">Admission</SelectItem>
                <SelectItem value="COURSE">Course</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb-order">Order</Label>
            <Input
              id="rb-order"
              type="number"
              min={0}
              max={999}
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Content *</Label>
          <RichTextEditor value={contentHtml} onChange={setContentHtml} />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : isEditing ? 'Update Block' : 'Create Block'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// Inline delete button with confirm
interface DeleteProps {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  blockId: string;
}

export function PgReqBlockDeleteButton({ programmeCode, degreeType, blockId }: DeleteProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await deleteRequirementBlock(programmeCode, degreeType, blockId);
        if (res.success) {
          toastSuccess('Block deleted.');
          router.refresh();
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
      <span className="inline-flex gap-1">
        <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
          {isPending ? '…' : 'Confirm'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          ✕
        </Button>
      </span>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
