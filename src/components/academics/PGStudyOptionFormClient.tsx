'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import { toastSuccess, toastError } from '@/lib/toast';
import { updatePostgraduateStudyOption } from '@/server/actions/postgraduateStudyOptions';

export type PGStudyOptionFormData = {
  id?: string;
  name: string;
  about: string;
};

interface Props {
  programmeCode: ProgrammeCode;
  initialData: PGStudyOptionFormData;
}

export function PGStudyOptionFormClient({ programmeCode, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData.name || '');
  const [about, setAbout] = useState(initialData.about || '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = { name, about: about || undefined };
        const res = await updatePostgraduateStudyOption(programmeCode, initialData.id!, payload);

        if (res.success) {
          toastSuccess('Study option updated.');
          router.refresh();
        } else {
          toastError(res.error || 'Something went wrong.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl pb-10">
      <div className="space-y-2">
        <FieldLabel required htmlFor="name">
          Name
        </FieldLabel>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Theoretical Physics"
          required
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor="about">About</FieldLabel>
        <Textarea
          id="about"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Describe this study option..."
          rows={5}
          maxLength={4000}
        />
      </div>
      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Update Study Option'}
        </Button>
      </div>
    </form>
  );
}
