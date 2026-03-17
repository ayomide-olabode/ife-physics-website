'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Checkbox } from '@/components/ui/checkbox';
import { createStaff } from '@/server/actions/adminStaff';
import { STAFF_TYPE_OPTIONS, STAFF_STATUS_OPTIONS } from '@/lib/options';
import { StaffType, StaffStatus } from '@prisma/client';
import { toast } from 'sonner';

export function CreateStaffForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [staffType, setStaffType] = useState<StaffType>('ACADEMIC');
  const [staffStatus, setStaffStatus] = useState<StaffStatus>('ACTIVE');
  const [designation, setDesignation] = useState('');
  const [academicRank, setAcademicRank] = useState('');
  const [isSuperAdminShell, setIsSuperAdminShell] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await createStaff({
        institutionalEmail: email,
        staffType,
        staffStatus,
        designation,
        academicRank,
        isSuperAdminShell,
      });

      if (result.inviteStatus === 'SENT') {
        toast.success(`Staff created. Invite link sent to ${result.institutionalEmail}.`);
      } else if (result.inviteStatus === 'THROTTLED') {
        toast.success(
          `Staff created. Invite already sent recently (try again in ${result.inviteMinutesRemaining ?? 1} minute(s)).`,
        );
      } else if (result.inviteStatus === 'ALREADY_ACTIVE') {
        toast.success('Staff created. This account is already active.');
      } else {
        toast.success('Staff record created successfully.');
      }

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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">1. Identity Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Personal identification attributes like names will be securely collected when the newly
          added staff completes their profile.
        </p>

        <div className="space-y-2">
          <FieldLabel htmlFor="email">Institutional Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="johndoe@oauife.edu.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">2. Staff Classification</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="staffType">Staff Type</FieldLabel>
            <select
              id="staffType"
              value={staffType}
              onChange={(e) => setStaffType(e.target.value as StaffType)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {STAFF_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="staffStatus">Initial Status</FieldLabel>
            <select
              id="staffStatus"
              value={staffStatus}
              onChange={(e) => setStaffStatus(e.target.value as StaffStatus)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {STAFF_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="academicRank">Academic Rank (Optional)</FieldLabel>
            <Input
              id="academicRank"
              placeholder="e.g. Professor, Lecturer I"
              value={academicRank}
              onChange={(e) => setAcademicRank(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="designation">Designation (Optional)</FieldLabel>
            <Input
              id="designation"
              placeholder="e.g. Lab Technician"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">3. User System Integration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          A user shell is automatically provisioned for onboarding and an invite link is sent to the
          staff email.
        </p>

        <div className="flex items-start space-x-3 rounded-md border p-4">
          <Checkbox
            id="isSuperAdminShell"
            checked={isSuperAdminShell}
            onCheckedChange={(checked) => setIsSuperAdminShell(checked as boolean)}
          />
          <div className="space-y-1 leading-none">
            <FieldLabel
              htmlFor="isSuperAdminShell"
              className="font-medium text-destructive cursor-pointer"
            >
              Invite as SuperAdmin
            </FieldLabel>
            <p className="text-sm text-muted-foreground mt-1">
              Grants this user absolute system-wide permissions across all data modules. Use with
              extreme caution.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
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
