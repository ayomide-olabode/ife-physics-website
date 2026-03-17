'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACADEMIC_RANK_OPTIONS, STAFF_TITLE_OPTIONS } from '@/lib/options';
import { updateStaffProfile } from '@/server/actions/profile/update';
import { toastSuccess, toastError } from '@/lib/toast';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function EditProfileForm({
  initialTitle,
  initialFirstName,
  initialMiddleName,
  initialLastName,
  initialAcademicRank,
  initialDesignation,
}: {
  initialTitle?: string | null;
  initialFirstName?: string | null;
  initialMiddleName?: string | null;
  initialLastName?: string | null;
  initialAcademicRank?: string | null;
  initialDesignation?: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle || '');
  const [firstName, setFirstName] = useState(initialFirstName || '');
  const [middleName, setMiddleName] = useState(initialMiddleName || '');
  const [lastName, setLastName] = useState(initialLastName || '');
  const [academicRank, setAcademicRank] = useState(initialAcademicRank || '');
  const [designation, setDesignation] = useState(initialDesignation || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title) {
      toastError('Title is required.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toastError('Both first and last names are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateStaffProfile({
        title,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        academicRank,
        designation: designation.trim(),
      });

      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Profile updated successfully!');
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel required htmlFor="title">
              Title
            </FieldLabel>
            <select
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Select title</option>
              {STAFF_TITLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <FieldLabel required htmlFor="firstName">
              First Name
            </FieldLabel>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="John"
              className="rounded-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
            <Input
              id="middleName"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="Optional"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel required htmlFor="lastName">
              Last Name
            </FieldLabel>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Doe"
              className="rounded-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="academicRank">Academic Rank</FieldLabel>
            <select
              id="academicRank"
              value={academicRank}
              onChange={(e) => setAcademicRank(e.target.value)}
              className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select rank</option>
              {ACADEMIC_RANK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Select your current academic rank.</p>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="designation">Designation</FieldLabel>
            <Input
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g., Postgraduate Chairman, Examination Officer..."
              className="rounded-none"
              maxLength={200}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="rounded-none">
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}
