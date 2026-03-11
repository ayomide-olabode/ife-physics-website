'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearSelect } from '@/components/forms/YearSelect';
import { toastSuccess, toastError } from '@/lib/toast';
import { createMyTeaching, updateMyTeaching } from '@/server/actions/profileTeaching';
import { useRouter } from 'next/navigation';

type FormDataState = {
  title: string;
  courseCode: string;
  sessionYear: string;
  semester: string;
};

const defaultValues: FormDataState = {
  title: '',
  courseCode: '',
  sessionYear: '',
  semester: '',
};

type TeachingEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string } & Partial<FormDataState>;
};

export function TeachingEditor({ open, onOpenChange, initialData }: TeachingEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEdit = !!initialData?.id;

  const [formData, setFormData] = useState<FormDataState>(() => ({
    ...defaultValues,
    ...initialData,
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    const payload = {
      title: formData.title,
      courseCode: formData.courseCode || undefined,
      sessionYear: formData.sessionYear ? parseInt(formData.sessionYear, 10) : undefined,
      semester: formData.semester || undefined,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && initialData?.id) {
        res = await updateMyTeaching(initialData.id, payload);
      } else {
        res = await createMyTeaching(payload);
      }

      if (res.success) {
        toastSuccess(`Teaching record ${isEdit ? 'updated' : 'added'} successfully.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toastError(res.error || 'Validation failed. Please check your inputs.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Teaching Record' : 'Add Teaching Record'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of your teaching responsibility.'
              : 'Add a new course or subject you teach.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="courseCode">Course Code (Optional)</FieldLabel>
            <Input
              id="courseCode"
              value={formData.courseCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, courseCode: e.target.value }))}
              placeholder="e.g. PHY101"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel required htmlFor="title">
              Course / Responsibility Title
            </FieldLabel>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Introduction to Physics"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="sessionYear">Session Year</FieldLabel>
              <YearSelect
                value={formData.sessionYear}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, sessionYear: val ? String(val) : '' }))
                }
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="semester">Semester</FieldLabel>
              <Input
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData((prev) => ({ ...prev, semester: e.target.value }))}
                placeholder="e.g. Harmattan"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
