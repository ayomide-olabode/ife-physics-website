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
import { THESIS_STATUS_OPTIONS, PROGRAMME_OPTIONS, DEGREE_OPTIONS } from '@/lib/options';
import { createMyThesis, updateMyThesis } from '@/server/actions/profileTheses';
import { useRouter } from 'next/navigation';
import { ThesisStatus } from '@prisma/client';

type FormDataState = {
  year: string;
  title: string;
  studentName: string;
  registrationNumber: string;
  programme: string;
  degreeLevel: string;
  externalUrl: string;
  status: ThesisStatus;
};

const defaultValues: FormDataState = {
  year: new Date().getFullYear().toString(),
  title: '',
  studentName: '',
  registrationNumber: '',
  programme: '',
  degreeLevel: '',
  externalUrl: '',
  status: 'ONGOING',
};

type ThesisEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string } & Partial<FormDataState>;
};

export function ThesisEditor({ open, onOpenChange, initialData }: ThesisEditorProps) {
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

    const yearNum = parseInt(formData.year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      toastError('Please enter a valid year.');
      return;
    }

    if (!formData.programme) {
      toastError('Programme is required.');
      return;
    }
    if (!formData.degreeLevel) {
      toastError('Degree Level is required.');
      return;
    }

    const payload = {
      year: yearNum,
      title: formData.title,
      studentName: formData.studentName || undefined,
      registrationNumber: formData.registrationNumber || undefined,
      programme: formData.programme,
      degreeLevel: formData.degreeLevel,
      externalUrl: formData.externalUrl || undefined,
      status: formData.status,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && initialData?.id) {
        res = await updateMyThesis(initialData.id, payload);
      } else {
        res = await createMyThesis(payload);
      }

      if (res.success) {
        toastSuccess(`Thesis ${isEdit ? 'updated' : 'added'} successfully.`);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Student Thesis' : 'Add New Student Thesis'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of the thesis/dissertation supervised.'
              : 'Add a new student thesis you have supervised or are currently supervising.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required htmlFor="year">
                Year
              </FieldLabel>
              <YearSelect
                value={formData.year}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, year: val ? String(val) : '' }))
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required htmlFor="status">
                Status
              </FieldLabel>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value as ThesisStatus }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {THESIS_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel required htmlFor="title">
              Title
            </FieldLabel>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Quantum Computing Approaches..."
              required
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="studentName">Student Name</FieldLabel>
            <Input
              id="studentName"
              value={formData.studentName}
              onChange={(e) => setFormData((prev) => ({ ...prev, studentName: e.target.value }))}
              placeholder="Full name of the student"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="registrationNumber">Registration Number</FieldLabel>
            <Input
              id="registrationNumber"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))
              }
              placeholder="e.g. PHY/2024/001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required htmlFor="degreeLevel">
                Degree Level
              </FieldLabel>
              <select
                id="degreeLevel"
                value={formData.degreeLevel}
                onChange={(e) => setFormData((prev) => ({ ...prev, degreeLevel: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>
                  Select Degree
                </option>
                {DEGREE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel required htmlFor="programme">
                Programme
              </FieldLabel>
              <select
                id="programme"
                value={formData.programme}
                onChange={(e) => setFormData((prev) => ({ ...prev, programme: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>
                  Select Programme
                </option>
                {PROGRAMME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="externalUrl">External URL</FieldLabel>
            <Input
              id="externalUrl"
              type="url"
              value={formData.externalUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, externalUrl: e.target.value }))}
              placeholder="e.g. https://repository.example.edu/thesis/..."
            />
          </div>

          <DialogFooter className="pt-4 border-t sticky bottom-0 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Thesis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
