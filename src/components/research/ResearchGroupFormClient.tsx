'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { toastSuccess, toastError } from '@/lib/toast';
import { useSlugField } from '@/lib/useSlugField';
import {
  addFocusArea,
  createResearchGroup,
  removeFocusArea,
  updateFocusArea,
  updateResearchGroup,
} from '@/server/actions/researchGroups';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';

export type ResearchGroupFormData = {
  id?: string;
  name: string;
  abbreviation: string;
  slug: string;
  overview: string | null;
  focusAreas: Array<{
    id: string;
    title: string;
    description: string | null;
  }>;
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
  const { slug, isManual, handleTitleChange, handleSlugChange, resetSlug } = useSlugField({
    initialSlug: initialData?.slug,
    isEditing,
  });
  const [overview, setOverview] = useState(initialData?.overview || '');
  const [focusAreas, setFocusAreas] = useState(
    (initialData?.focusAreas || []).map((focusArea) => ({ ...focusArea })),
  );
  const [newFocusAreaTitle, setNewFocusAreaTitle] = useState('');
  const [isAddingFocusArea, setIsAddingFocusArea] = useState(false);
  const [updatingFocusAreaIds, setUpdatingFocusAreaIds] = useState<string[]>([]);
  const [removingFocusAreaId, setRemovingFocusAreaId] = useState<string | null>(null);
  const [focusAreaPendingDelete, setFocusAreaPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const savedTitlesRef = useRef<Record<string, string>>(
    Object.fromEntries(
      (initialData?.focusAreas || []).map((focusArea) => [focusArea.id, focusArea.title]),
    ),
  );
  const sortedFocusAreas = useMemo(() => [...focusAreas], [focusAreas]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name,
          abbreviation,
          slug,
          overview: overview || undefined,
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

  const handleFocusAreaInputChange = (id: string, title: string) => {
    setFocusAreas((prev) =>
      prev.map((focusArea) => (focusArea.id === id ? { ...focusArea, title } : focusArea)),
    );
  };

  const handleFocusAreaBlur = async (id: string) => {
    const focusArea = focusAreas.find((item) => item.id === id);
    if (!focusArea) return;

    const trimmedTitle = focusArea.title.trim();
    const savedTitle = savedTitlesRef.current[id] ?? '';
    if (trimmedTitle === savedTitle) return;
    if (!trimmedTitle) {
      toastError('Focus area title is required.');
      setFocusAreas((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title: savedTitle } : item)),
      );
      return;
    }

    setUpdatingFocusAreaIds((prev) => [...prev, id]);
    const res = await updateFocusArea(id, trimmedTitle);
    setUpdatingFocusAreaIds((prev) => prev.filter((item) => item !== id));

    if (!res.success) {
      toastError(res.error || 'Failed to update focus area.');
      setFocusAreas((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title: savedTitle } : item)),
      );
      return;
    }

    savedTitlesRef.current[id] = trimmedTitle;
    setFocusAreas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: trimmedTitle } : item)),
    );
    toastSuccess('Focus area updated.');
  };

  const handleAddFocusArea = async () => {
    if (!initialData?.id) {
      toastError('Save the group first before adding focus areas.');
      return;
    }

    const title = newFocusAreaTitle.trim();
    if (!title) {
      toastError('Enter a focus area title.');
      return;
    }

    setIsAddingFocusArea(true);
    const res = await addFocusArea(initialData.id, title);
    setIsAddingFocusArea(false);

    if (!res.success || !('focusArea' in res) || !res.focusArea) {
      toastError(res.error || 'Failed to add focus area.');
      return;
    }

    const added = res.focusArea;
    savedTitlesRef.current[added.id] = added.title;
    setFocusAreas((prev) => [...prev, added]);
    setNewFocusAreaTitle('');
    toastSuccess('Focus area added.');
  };

  const confirmRemoveFocusArea = async () => {
    if (!focusAreaPendingDelete) return;
    setRemovingFocusAreaId(focusAreaPendingDelete.id);
    const res = await removeFocusArea(focusAreaPendingDelete.id);
    setRemovingFocusAreaId(null);

    if (!res.success) {
      toastError(res.error || 'Failed to remove focus area.');
      return;
    }

    delete savedTitlesRef.current[focusAreaPendingDelete.id];
    setFocusAreas((prev) => prev.filter((focusArea) => focusArea.id !== focusAreaPendingDelete.id));
    toastSuccess('Focus area removed.');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <FieldLabel required htmlFor="name">
            Name
          </FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              handleTitleChange(e.target.value);
            }}
            placeholder="e.g. Theoretical Physics Group"
            required
            maxLength={200}
            className="rounded-none"
          />
        </div>
        <div className="space-y-2">
          <FieldLabel required htmlFor="abbreviation">
            Abbreviation
          </FieldLabel>
          <Input
            id="abbreviation"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            placeholder="e.g. TPG"
            required
            maxLength={10}
            className="rounded-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="slug">
          Slug
        </FieldLabel>
        <div className="flex gap-2">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="e.g. theoretical-physics"
            required
            maxLength={100}
            className="rounded-none"
          />
          {isManual && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-none"
              onClick={() => resetSlug(name)}
              title="Sync from name"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          URL-friendly identifier. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      <div className="space-y-2">
        <FieldLabel>Overview</FieldLabel>
        <RichTextEditor value={overview} onChange={setOverview} />
      </div>

      <div className="space-y-4 border rounded-none p-4">
        <div>
          <FieldLabel>Focus Areas</FieldLabel>
          <p className="text-xs text-muted-foreground mt-1">
            Add and manage focus area titles for this research group.
          </p>
        </div>

        {!isEditing ? (
          <div className="text-sm text-muted-foreground border rounded-none p-3 bg-muted/20">
            Save this research group first, then add focus areas.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFocusAreas.length === 0 ? (
              <div className="text-sm text-muted-foreground border rounded-none p-3 bg-muted/20">
                No focus areas added yet.
              </div>
            ) : (
              sortedFocusAreas.map((focusArea) => {
                const isUpdating = updatingFocusAreaIds.includes(focusArea.id);
                const isRemoving = removingFocusAreaId === focusArea.id;
                return (
                  <div key={focusArea.id} className="flex items-start gap-2">
                    <Input
                      value={focusArea.title}
                      onChange={(e) => handleFocusAreaInputChange(focusArea.id, e.target.value)}
                      onBlur={() => void handleFocusAreaBlur(focusArea.id)}
                      maxLength={300}
                      className="rounded-none"
                      disabled={isUpdating || isRemoving}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-none shrink-0"
                      onClick={() =>
                        setFocusAreaPendingDelete({ id: focusArea.id, title: focusArea.title })
                      }
                      disabled={isUpdating || isRemoving}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                );
              })
            )}

            <div className="flex items-start gap-2 pt-1">
              <Input
                value={newFocusAreaTitle}
                onChange={(e) => setNewFocusAreaTitle(e.target.value)}
                maxLength={300}
                placeholder="e.g. Materials Characterization"
                className="rounded-none"
                disabled={isAddingFocusArea}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-none shrink-0"
                onClick={handleAddFocusArea}
                disabled={isAddingFocusArea}
              >
                <Plus className="h-4 w-4" />
                {isAddingFocusArea ? 'Adding...' : 'Add Focus Area'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending} className="rounded-none">
          {isPending ? 'Saving…' : isEditing ? 'Update Group' : 'Create Group'}
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(focusAreaPendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setFocusAreaPendingDelete(null);
          }
        }}
        title="Remove Focus Area"
        description={`Are you sure you want to remove "${focusAreaPendingDelete?.title || 'this focus area'}"?`}
        confirmText="Remove"
        destructive
        onConfirm={async () => {
          await confirmRemoveFocusArea();
          setFocusAreaPendingDelete(null);
        }}
      />
    </form>
  );
}
