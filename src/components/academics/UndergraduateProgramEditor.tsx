'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { updateUndergraduateProgram } from '@/server/actions/undergraduateProgram';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProgrammeCode } from '@prisma/client';

type UndergraduateProgramData = {
  overviewProspects: string | null;
  admissionRequirements: string | null;
  courseRequirements: string | null;
  curriculum: string | null;
  programmeStructure: string | null;
  studyOptionsText: string | null;
  courseDescriptionsIntro: string | null;
};

interface UndergraduateProgramEditorProps {
  programmeCode: ProgrammeCode;
  initialData: UndergraduateProgramData | null;
}

export function UndergraduateProgramEditor({
  programmeCode,
  initialData,
}: UndergraduateProgramEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [overviewProspects, setOverviewProspects] = useState(initialData?.overviewProspects || '');
  const [admissionRequirements, setAdmissionRequirements] = useState(
    initialData?.admissionRequirements || '',
  );
  const [courseRequirements, setCourseRequirements] = useState(
    initialData?.courseRequirements || '',
  );
  const [curriculum, setCurriculum] = useState(initialData?.curriculum || '');
  const [programmeStructure, setProgrammeStructure] = useState(
    initialData?.programmeStructure || '',
  );
  const [studyOptionsText, setStudyOptionsText] = useState(initialData?.studyOptionsText || '');
  const [courseDescriptionsIntro, setCourseDescriptionsIntro] = useState(
    initialData?.courseDescriptionsIntro || '',
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const payload = {
          overviewProspects,
          admissionRequirements,
          courseRequirements,
          curriculum,
          programmeStructure,
          studyOptionsText,
          courseDescriptionsIntro,
        };

        const res = await updateUndergraduateProgram(programmeCode, payload);
        if (res.success) {
          toastSuccess('Undergraduate programme sections updated.');
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
        <Label>Overview & Prospects</Label>
        <RichTextEditor value={overviewProspects} onChange={setOverviewProspects} />
      </div>

      <div className="space-y-2">
        <Label>Admission Requirements</Label>
        <RichTextEditor value={admissionRequirements} onChange={setAdmissionRequirements} />
      </div>

      <div className="space-y-2">
        <Label>Course Requirements</Label>
        <RichTextEditor value={courseRequirements} onChange={setCourseRequirements} />
      </div>

      <div className="space-y-2">
        <Label>Curriculum</Label>
        <RichTextEditor value={curriculum} onChange={setCurriculum} />
      </div>

      <div className="space-y-2">
        <Label>Programme Structure</Label>
        <RichTextEditor value={programmeStructure} onChange={setProgrammeStructure} />
      </div>

      <div className="space-y-2">
        <Label>Study Options (Text)</Label>
        <RichTextEditor value={studyOptionsText} onChange={setStudyOptionsText} />
      </div>

      <div className="space-y-2">
        <Label>Course Descriptions Intro</Label>
        <RichTextEditor value={courseDescriptionsIntro} onChange={setCourseDescriptionsIntro} />
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
