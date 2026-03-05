'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toastSuccess, toastError } from '@/lib/toast';
import {
  createPostgraduateCourseForProgramme,
  updatePostgraduateCourseForProgramme,
} from '@/server/actions/postgraduateCourses';

export type PGCourseFormData = {
  id?: string;
  code: string;
  title: string;
  description: string | null;
  prerequisites: string | null;
  L: number | null;
  T: number | null;
  P: number | null;
  U: number | null;
  status: 'CORE' | 'RESTRICTED';
};

interface PGCourseFormClientProps {
  programmeCode: ProgrammeCode;
  initialData?: PGCourseFormData;
}

export function PGCourseFormClient({ programmeCode, initialData }: PGCourseFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initialData?.id);

  const [code, setCode] = useState(initialData?.code || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [prerequisites, setPrerequisites] = useState(initialData?.prerequisites || '');
  const [L, setL] = useState(initialData?.L ?? 0);
  const [T, setT] = useState(initialData?.T ?? 0);
  const [P, setP] = useState(initialData?.P ?? 0);
  const [U, setU] = useState(initialData?.U ?? 0);
  const [status, setStatus] = useState<'CORE' | 'RESTRICTED'>(initialData?.status || 'CORE');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const payload = {
          code,
          title,
          description: description || undefined,
          prerequisites: prerequisites || undefined,
          L,
          T,
          P,
          U,
          status,
        };

        const res = isEditing
          ? await updatePostgraduateCourseForProgramme(programmeCode, initialData!.id!, payload)
          : await createPostgraduateCourseForProgramme(programmeCode, payload);

        if (res.success) {
          toastSuccess(isEditing ? 'Course updated.' : 'Course created.');
          if (!isEditing && res.courseId) {
            router.push(
              `/dashboard/postgraduate/${programmeCode.toLowerCase()}/courses/${res.courseId}`,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Course Code *</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. PHY701"
            required
            maxLength={12}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as 'CORE' | 'RESTRICTED')}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CORE">CORE</SelectItem>
              <SelectItem value="RESTRICTED">RESTRICTED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Course title"
          required
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional course description"
          rows={4}
          maxLength={4000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prerequisites">Prerequisites</Label>
        <Input
          id="prerequisites"
          value={prerequisites}
          onChange={(e) => setPrerequisites(e.target.value)}
          placeholder="e.g. PHY501, MTH601"
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="L">L (Lectures)</Label>
          <Input
            id="L"
            type="number"
            min={0}
            max={10}
            value={L}
            onChange={(e) => setL(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="T">T (Tutorials)</Label>
          <Input
            id="T"
            type="number"
            min={0}
            max={10}
            value={T}
            onChange={(e) => setT(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="P">P (Practicals)</Label>
          <Input
            id="P"
            type="number"
            min={0}
            max={10}
            value={P}
            onChange={(e) => setP(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="U">U (Units)</Label>
          <Input
            id="U"
            type="number"
            min={0}
            max={10}
            value={U}
            onChange={(e) => setU(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEditing ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}
