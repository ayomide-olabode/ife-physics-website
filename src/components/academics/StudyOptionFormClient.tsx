'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import { toastSuccess, toastError } from '@/lib/toast';
import { createStudyOption, updateStudyOption } from '@/server/actions/undergraduateStudyOptions';

export type StudyOptionFormData = {
  id?: string;
  name: string;
  about: string;
};

interface StudyOptionFormClientProps {
  programmeCode: ProgrammeCode;
  initialData?: StudyOptionFormData;
}

export function StudyOptionFormClient({ programmeCode, initialData }: StudyOptionFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState(initialData?.name || '');
  const [about, setAbout] = useState(initialData?.about || '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const payload = { name, about: about || undefined };

        const res = isEditing
          ? await updateStudyOption(programmeCode, initialData!.id!, payload)
          : await createStudyOption(programmeCode, payload);

        if (res.success) {
          toastSuccess(isEditing ? 'Study option updated.' : 'Study option created.');
          if (!isEditing && 'studyOptionId' in res && res.studyOptionId) {
            router.push(
              `/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options/${res.studyOptionId}`,
            );
          } else {
            router.refresh();
          }
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
          placeholder="e.g. Applied Physics"
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
          {isPending ? 'Saving…' : isEditing ? 'Update Study Option' : 'Create Study Option'}
        </Button>
      </div>
    </form>
  );
}
