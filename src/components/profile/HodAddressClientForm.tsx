'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMyHodAddress } from '@/server/actions/profileHodAddress';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';

type HodAddressClientFormProps = {
  initialTitle?: string;
  initialBody?: string;
};

export function HodAddressClientForm({ initialTitle, initialBody }: HodAddressClientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialTitle || '');
  const [body, setBody] = useState(initialBody || '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toastError('Both title and body are required.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateMyHodAddress({ title, body });
        if (res.success) {
          toastSuccess('HOD Address updated.');
          router.refresh();
        } else {
          toastError(res.error || 'Validation payload checks failed structurally.');
        }
      } catch {
        toastError('Unexpected mapping error mutating identity block settings.');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6 mt-8">
      <div className="space-y-2">
        <FieldLabel required htmlFor="title">
          Title
        </FieldLabel>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Welcome to the Department of Physics"
          required
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">Appears as the main heading. Max 120 chars.</p>
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="body">
          Message Body
        </FieldLabel>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Your welcoming address content..."
          rows={12}
          required
          maxLength={4000}
        />
        <p className="text-xs text-muted-foreground">
          The full welcoming message text. Max 4000 chars.
        </p>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save HOD Address'}
        </Button>
      </div>
    </form>
  );
}
