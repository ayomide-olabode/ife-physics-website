'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { toastSuccess, toastError } from '@/lib/toast';
import { createResearchGroup, updateResearchGroup } from '@/server/actions/researchGroups';

export type ResearchGroupFormData = {
  id?: string;
  name: string;
  abbreviation: string;
  slug: string;
  overview: string | null;
  focusAreas: string | null;
};

interface Props {
  initialData?: ResearchGroupFormData;
}

export function ResearchGroupFormClient({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState(initialData?.name || '');
  const [abbreviation, setAbbreviation] = useState(initialData?.abbreviation || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [overview, setOverview] = useState(initialData?.overview || '');
  const [focusAreas, setFocusAreas] = useState(initialData?.focusAreas || '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name,
          abbreviation,
          slug,
          overview: overview || undefined,
          focusAreas: focusAreas || undefined,
        };

        const res = isEditing
          ? await updateResearchGroup(initialData!.id!, payload)
          : await createResearchGroup(payload);

        if (res.success) {
          toastSuccess(isEditing ? 'Group updated.' : 'Group created.');
          if (!isEditing && 'groupId' in res && res.groupId) {
            router.push(`/dashboard/research/groups/${res.groupId}`);
          } else {
            router.refresh();
          }
        } else {
          toastError(res.error || 'Something went wrong.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Theoretical Physics Group"
            required
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="abbreviation">Abbreviation *</Label>
          <Input
            id="abbreviation"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            placeholder="e.g. TPG"
            required
            maxLength={10}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. theoretical-physics"
          required
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          URL-friendly identifier. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Overview</Label>
        <RichTextEditor value={overview} onChange={setOverview} />
      </div>

      <div className="space-y-2">
        <Label>Focus Areas</Label>
        <RichTextEditor value={focusAreas} onChange={setFocusAreas} />
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEditing ? 'Update Group' : 'Create Group'}
        </Button>
      </div>
    </form>
  );
}
