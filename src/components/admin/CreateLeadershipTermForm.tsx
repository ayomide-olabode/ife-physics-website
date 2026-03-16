'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';

import { LEADERSHIP_ROLE_OPTIONS, PROGRAMME_OPTIONS } from '@/lib/options';
import { createLeadershipTerm } from '@/server/actions/leadershipTerms';
import { searchStaff } from '@/server/queries/staffSearch';
import { toastSuccess, toastError } from '@/lib/toast';
import { LeadershipRole, ProgrammeCode } from '@prisma/client';
import { formatPersonName } from '@/lib/name';

export function CreateLeadershipTermForm() {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      firstName: string | null;
      middleName: string | null;
      lastName: string | null;
      institutionalEmail: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Form state
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [role, setRole] = useState<LeadershipRole | ''>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [programmeCode, setProgrammeCode] = useState<ProgrammeCode | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 2) return;

    setIsSearching(true);
    setHasSearched(false);
    try {
      const results = await searchStaff({ q: searchQuery });
      setSearchResults(results);
      setHasSearched(true);
    } catch {
      toastError('Failed to search staff.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedStaffId) {
      toastError('Please select a staff member.');
      return;
    }

    if (!role) {
      toastError('Please select a leadership role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createLeadershipTerm({
        staffId: selectedStaffId,
        role: role as LeadershipRole,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        programmeCode: programmeCode ? (programmeCode as ProgrammeCode) : null,
      });

      if (res.error) {
        toastError(res.error);
        setIsSubmitting(false);
      } else {
        toastSuccess('Leadership term created.');
        router.push('/dashboard/admin/leadership');
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* 1. Staff Selection */}
      <div className="space-y-4 rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-medium">1. Select Staff Member</h3>
        <p className="text-sm text-muted-foreground">
          Search for the staff member to assign this term to.
        </p>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="E.g., John Doe"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || searchQuery.length < 2}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {!hasSearched && !isSearching && (
          <p className="mt-2 text-sm text-muted-foreground">Type to search by name or email.</p>
        )}

        {hasSearched && searchResults.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No staff found.</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2 border rounded-md p-2 max-h-60 overflow-y-auto">
            {searchResults.map((staff) => (
              <label
                key={staff.id}
                className={`flex items-start space-x-3 p-3 rounded-md cursor-pointer border transition-colors ${
                  selectedStaffId === staff.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="staffSelection"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    checked={selectedStaffId === staff.id}
                    onChange={() => setSelectedStaffId(staff.id)}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {formatPersonName({
                      firstName: staff.firstName,
                      middleName: staff.middleName,
                      lastName: staff.lastName,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">{staff.institutionalEmail}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 2. Term Details */}
      <div className="space-y-4 rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-medium">2. Term Details</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as LeadershipRole)}
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="" disabled>
                Select a role...
              </option>
              {LEADERSHIP_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {role === 'ACADEMIC_COORDINATOR' && (
            <div className="space-y-2">
              <FieldLabel htmlFor="programmeCode">Programme Code (Optional)</FieldLabel>
              <select
                id="programmeCode"
                value={programmeCode}
                onChange={(e) => setProgrammeCode(e.target.value as ProgrammeCode)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">None / General</option>
                {PROGRAMME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.label})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="endDate">End Date (Optional)</FieldLabel>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank for an ongoing term.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedStaffId}>
          {isSubmitting ? 'Creating Term...' : 'Create Term'}
        </Button>
      </div>
    </form>
  );
}
