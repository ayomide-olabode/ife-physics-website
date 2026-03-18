'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateMySecondaryAffiliation } from '@/server/actions/profileSecondaryAffiliation';
import { toastError, toastSuccess } from '@/lib/toast';

interface SecondaryAffiliationOption {
  id: string;
  name: string;
  acronym: string | null;
}

interface SecondaryAffiliationSelectorProps {
  initialSecondaryAffiliationId: string | null;
  options: SecondaryAffiliationOption[];
}

export function SecondaryAffiliationSelector({
  initialSecondaryAffiliationId,
  options,
}: SecondaryAffiliationSelectorProps) {
  const router = useRouter();
  const initialValue = initialSecondaryAffiliationId ?? 'none';
  const [selectedId, setSelectedId] = useState<string>(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanged = useMemo(() => selectedId !== initialValue, [selectedId, initialValue]);

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const nextId = selectedId === 'none' ? null : selectedId;
      const result = await updateMySecondaryAffiliation({ secondaryAffiliationId: nextId });
      if (result.error) {
        toastError(result.error);
      } else {
        toastSuccess('Secondary affiliation updated.');
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setSelectedId(initialValue);
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="secondary-affiliation">Secondary Affiliation (Optional)</Label>
        <select
          id="secondary-affiliation"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={isSubmitting}
          className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="none">None</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.acronym ? `${option.name} (${option.acronym})` : option.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          onClick={handleCancel}
          disabled={isSubmitting || !hasChanged}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-none"
          onClick={handleSave}
          disabled={isSubmitting || !hasChanged}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
