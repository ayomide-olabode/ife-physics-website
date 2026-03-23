'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/lib/toast';
import { updateMyResearchGroupMembership } from '@/server/actions/profileResearchGroupMembership';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatShortDate } from '@/lib/format-date';

interface ResearchGroupOption {
  id: string;
  name: string;
  abbreviation: string;
}

interface Props {
  initialGroupId: string | null;
  options: ResearchGroupOption[];
  lastUpdatedAt?: Date | string | null;
}

export function ResearchGroupMembershipForm({ initialGroupId, options, lastUpdatedAt }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(initialGroupId || 'none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentGroup = options.find((opt) => opt.id === selectedId);
  const currentGroupLabel =
    selectedId === 'none'
      ? 'Not set.'
      : currentGroup
        ? `${currentGroup.name} (${currentGroup.abbreviation})`
        : 'Not set.';

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const pubId = selectedId === 'none' ? null : selectedId;
      const res = await updateMyResearchGroupMembership({ researchGroupId: pubId });
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Research group membership updated.');
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedId(initialGroupId || 'none');
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6 border-b pb-2">
        <h2 className="text-xl font-semibold">Research Group Membership</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select the research group you belong to. This helps link publications to research groups.
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatShortDate(lastUpdatedAt ?? null)}
          </p>
          {!isEditing && (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {!isEditing ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Research Group
            </p>
            <p className="text-sm">{currentGroupLabel}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="research-group">Research Group</Label>
              <Select value={selectedId} onValueChange={setSelectedId} disabled={isSubmitting}>
                <SelectTrigger id="research-group">
                  <SelectValue placeholder="Select a research group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name} ({opt.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting || selectedId === (initialGroupId || 'none')}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Selection
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
