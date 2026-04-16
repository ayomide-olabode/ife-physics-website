'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { createStaff } from '@/server/actions/adminStaff';
import { STAFF_TYPE_OPTIONS } from '@/lib/options';
import { StaffType } from '@prisma/client';
import { toast } from 'sonner';

export function CreateStaffForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [staffType, setStaffType] = useState<StaffType>('ACADEMIC');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await createStaff({
        institutionalEmail: email,
        firstName,
        middleName,
        lastName,
        staffType,
      });

      toast.success('Staff profile created successfully.');

      router.push(`/dashboard/admin/staff/${result.staffId}`);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during staff creation.');
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">1. Identity Information</h3>
        <p className="text-base text-muted-foreground mb-4">
          Provide core profile identity data. Email is optional for in-memoriam staff records.
        </p>

        <div className="space-y-2">
          <FieldLabel htmlFor="email">Email (Optional)</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="staff@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
            <Input
              id="middleName"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">2. Staff Classification</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="staffType">Staff Type</FieldLabel>
            <select
              id="staffType"
              value={staffType}
              onChange={(e) => setStaffType(e.target.value as StaffType)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {STAFF_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-base text-muted-foreground">
            New staff records are created as <strong>Active</strong> by default. You can update
            lifecycle status later on the staff detail page.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-base text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/admin/staff')}
          className="mr-2"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Create Staff Record'}
        </Button>
      </div>
    </form>
  );
}
