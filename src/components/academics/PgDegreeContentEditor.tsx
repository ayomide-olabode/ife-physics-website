'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode, DegreeType } from '@prisma/client';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { toastSuccess, toastError } from '@/lib/toast';
import { updatePgDegreeContent } from '@/server/actions/pgDegreeContent';

interface PgDegreeContentData {
  admissionHtml: string;
  periodHtml: string;
  courseHtml: string;
  examHtml: string;
}

interface Props {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  initialData: PgDegreeContentData | null;
}

export function PgDegreeContentEditor({ programmeCode, degreeType, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [admissionHtml, setAdmissionHtml] = useState(initialData?.admissionHtml || '');
  const [periodHtml, setPeriodHtml] = useState(initialData?.periodHtml || '');
  const [courseHtml, setCourseHtml] = useState(initialData?.courseHtml || '');
  const [examHtml, setExamHtml] = useState(initialData?.examHtml || '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!admissionHtml || !periodHtml || !courseHtml || !examHtml) {
      toastError('All fields are required.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          admissionHtml,
          periodHtml,
          courseHtml,
          examHtml,
        };

        const res = await updatePgDegreeContent(programmeCode, degreeType, payload);
        if (res.success) {
          toastSuccess('Degree content updated.');
          router.refresh();
        } else {
          toastError(res.error || 'Failed to update content.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl pb-10">
      <div className="space-y-2">
        <FieldLabel required>Admission Requirements</FieldLabel>
        <RichTextEditor value={admissionHtml} onChange={setAdmissionHtml} />
      </div>

      <div className="space-y-2">
        <FieldLabel required>Period of Study</FieldLabel>
        <RichTextEditor value={periodHtml} onChange={setPeriodHtml} />
      </div>

      <div className="space-y-2">
        <FieldLabel required>Course Requirements</FieldLabel>
        <RichTextEditor value={courseHtml} onChange={setCourseHtml} />
      </div>

      <div className="space-y-2">
        <FieldLabel required>Examination Format</FieldLabel>
        <RichTextEditor value={examHtml} onChange={setExamHtml} />
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
