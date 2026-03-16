'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { updateStaffProfile } from '@/server/actions/profile/update';
import { toastSuccess, toastError } from '@/lib/toast';

export function EditProfileForm({
  initialFirstName,
  initialMiddleName,
  initialLastName,
}: {
  initialFirstName?: string | null;
  initialMiddleName?: string | null;
  initialLastName?: string | null;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName || '');
  const [middleName, setMiddleName] = useState(initialMiddleName || '');
  const [lastName, setLastName] = useState(initialLastName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toastError('Both first and last names are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateStaffProfile({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
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
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
          <Input
            id="middleName"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder="Optional"
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
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}
