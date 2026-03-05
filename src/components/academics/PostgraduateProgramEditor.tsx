'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { updatePostgraduateProgram } from '@/server/actions/postgraduateProgram';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProgrammeCode } from '@prisma/client';

type PostgraduateProgramData = {
  overviewProspects: string | null;
  studyOptionsText: string | null;
  curriculum: string | null;
  programmeStructure: string | null;
};

interface PostgraduateProgramEditorProps {
  programmeCode: ProgrammeCode;
  initialData: PostgraduateProgramData | null;
}

export function PostgraduateProgramEditor({
  programmeCode,
  initialData,
}: PostgraduateProgramEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [overviewProspects, setOverviewProspects] = useState(initialData?.overviewProspects || '');
  const [studyOptionsText, setStudyOptionsText] = useState(initialData?.studyOptionsText || '');
  const [curriculum, setCurriculum] = useState(initialData?.curriculum || '');
  const [programmeStructure, setProgrammeStructure] = useState(
    initialData?.programmeStructure || '',
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const payload = {
          overviewProspects,
          studyOptionsText,
          curriculum,
          programmeStructure,
        };

        const res = await updatePostgraduateProgram(programmeCode, payload);
        if (res.success) {
          toastSuccess('Postgraduate programme sections updated.');
          router.refresh();
        } else {
          toastError(res.error || 'Failed to update sections.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl pb-10">
      <div className="space-y-2">
        <Label>Overview &amp; Prospects</Label>
        <RichTextEditor value={overviewProspects} onChange={setOverviewProspects} />
      </div>

      <div className="space-y-2">
        <Label>Study Options (Text)</Label>
        <RichTextEditor value={studyOptionsText} onChange={setStudyOptionsText} />
      </div>

      <div className="space-y-2">
        <Label>Curriculum</Label>
        <RichTextEditor value={curriculum} onChange={setCurriculum} />
      </div>

      <div className="space-y-2">
        <Label>Programme Structure</Label>
        <RichTextEditor value={programmeStructure} onChange={setProgrammeStructure} />
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
