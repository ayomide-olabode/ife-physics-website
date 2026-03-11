'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { createRollOfHonour, updateRollOfHonour } from '@/server/actions/rollOfHonour';
import { toastSuccess, toastError } from '@/lib/toast';
import { RollOfHonourImageUploader } from './RollOfHonourImageUploader';
import { YearSelect } from '@/components/forms/YearSelect';

type FormDataState = {
  name: string;
  registrationNumber: string;
  programme: string;
  cgpa: string;
  graduatingYear: string;
  imageUrl: string | null;
};

export function RollOfHonourFormClient({
  initialData,
}: {
  initialData?: {
    id: string;
    name: string;
    registrationNumber: string;
    programme: string;
    cgpa: number;
    graduatingYear: number;
    imageUrl: string | null;
  };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!initialData?.id;

  const [formData, setFormData] = useState<FormDataState>(() => ({
    name: initialData?.name || '',
    registrationNumber: initialData?.registrationNumber || '',
    programme: initialData?.programme || '',
    cgpa: initialData?.cgpa ? String(initialData.cgpa) : '',
    graduatingYear: initialData?.graduatingYear ? String(initialData.graduatingYear) : '',
    imageUrl: initialData?.imageUrl || null,
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toastError('Name is required');
    if (!formData.registrationNumber.trim()) return toastError('Registration Number is required');
    if (!formData.programme.trim()) return toastError('Programme is required');

    const cgpaNum = parseFloat(formData.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 5) {
      return toastError('CGPA must be a number between 0 and 5');
    }

    const yearNum = parseInt(formData.graduatingYear, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      return toastError(`Graduating Year must be between 1900 and ${currentYear + 1}`);
    }

    const payload = {
      name: formData.name,
      registrationNumber: formData.registrationNumber,
      programme: formData.programme,
      cgpa: cgpaNum,
      graduatingYear: yearNum,
      imageUrl: formData.imageUrl,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        await updateRollOfHonour(initialData.id, payload);
        toastSuccess('Roll of Honour entry updated successfully.');
      } else {
        const res = await createRollOfHonour(payload);
        toastSuccess('Roll of Honour entry created.');
        router.push(`/dashboard/content/roll-of-honour/${res.id}`);
        return; // Avoid push to index during redirect
      }

      router.push('/dashboard/content/roll-of-honour');
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
      <div className="bg-white p-6 rounded-lg border shadow-sm h-fit">
        <form id="roh-form" onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <FieldLabel required htmlFor="name">
              Full Name
            </FieldLabel>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. John Doe Olanrewaju"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required htmlFor="registrationNumber">
                Registration Number
              </FieldLabel>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))
                }
                placeholder="e.g. PHY/2012/001"
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required htmlFor="programme">
                Programme
              </FieldLabel>
              <Input
                id="programme"
                value={formData.programme}
                onChange={(e) => setFormData((prev) => ({ ...prev, programme: e.target.value }))}
                placeholder="e.g. Physics (B.Sc)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required htmlFor="cgpa">
                CGPA
              </FieldLabel>
              <Input
                id="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.cgpa}
                onChange={(e) => setFormData((prev) => ({ ...prev, cgpa: e.target.value }))}
                placeholder="e.g. 4.56"
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required htmlFor="graduatingYear">
                Graduating Year
              </FieldLabel>
              <YearSelect
                value={formData.graduatingYear}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, graduatingYear: val ? String(val) : '' }))
                }
              />
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h3 className="text-sm font-semibold">Student Photo</h3>
          <RollOfHonourImageUploader
            value={formData.imageUrl}
            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
            onRemove={() => setFormData((prev) => ({ ...prev, imageUrl: null }))}
          />
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col gap-3">
          <Button type="submit" form="roh-form" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Entry'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard/content/roll-of-honour')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
