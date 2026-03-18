'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { toastError, toastSuccess } from '@/lib/toast';
import { upsertDepartmentalTribute } from '@/server/actions/departmentalTribute';

interface DepartmentalTributeFormClientProps {
  staffId: string;
  initialTitle?: string;
  initialBodyHtml?: string;
}

export function DepartmentalTributeFormClient({
  staffId,
  initialTitle = '',
  initialBodyHtml = '',
}: DepartmentalTributeFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialTitle);
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);

  function handleCancel() {
    setTitle(initialTitle);
    setBodyHtml(initialBodyHtml);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await upsertDepartmentalTribute({
        staffId,
        title,
        bodyHtml,
      });

      if (!result.success) {
        toastError(result.error || 'Failed to save tribute.');
        return;
      }

      toastSuccess('Departmental tribute saved.');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-md border p-4">
      <div className="space-y-2">
        <FieldLabel htmlFor="tributeTitle">Tribute Title</FieldLabel>
        <Input
          id="tributeTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g., In Loving Memory of..."
          required
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Tribute Body</FieldLabel>
        <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
      </div>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Tribute'}
        </Button>
      </div>
    </form>
  );
}
