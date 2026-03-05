'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toastSuccess, toastError } from '@/lib/toast';
import { createLegacyItem, updateLegacyItem } from '@/server/actions/legacyGallery';
import { Loader2 } from 'lucide-react';
import { LegacyMediaUploader } from './LegacyMediaUploader';

const legacyGallerySchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  bioText: z.string().min(1, 'Bio text is required').max(4000),
  year: z.coerce.number().optional().nullable(),
  datesText: z.string().max(100).optional().nullable(),
  mediaUrl: z.string().min(1, 'A photo or media upload is required'),
});

type LegacyFormData = z.infer<typeof legacyGallerySchema>;

export function LegacyGalleryFormClient({
  initialData,
}: {
  initialData?: LegacyFormData & { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<LegacyFormData>({
    title: initialData?.title || '',
    bioText: initialData?.bioText || '',
    year: initialData?.year || null,
    datesText: initialData?.datesText || '',
    mediaUrl: initialData?.mediaUrl || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsed = legacyGallerySchema.parse(data);

      if (initialData?.id) {
        await updateLegacyItem(initialData.id, parsed);
        toastSuccess('Legacy item updated successfully!');
      } else {
        await createLegacyItem(parsed);
        toastSuccess('Legacy item created successfully!');
      }

      router.push('/dashboard/content/legacy-gallery');
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-card p-6 border rounded-lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>
            Media Photo <span className="text-destructive">*</span>
          </Label>
          <LegacyMediaUploader
            value={data.mediaUrl}
            onChange={(url) => setData({ ...data, mediaUrl: url })}
            onRemove={() => setData({ ...data, mediaUrl: '' })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="E.g., Dr. Jane Doe or The Discovery of the Atom"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Timeline Year</Label>
            <Input
              id="year"
              type="number"
              value={data.year || ''}
              onChange={(e) =>
                setData({ ...data, year: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="e.g. 1999"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="datesText">Dates Text</Label>
            <Input
              id="datesText"
              value={data.datesText || ''}
              onChange={(e) => setData({ ...data, datesText: e.target.value })}
              placeholder="e.g. 1978–2004"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bioText">
            Biographical / Historical Text <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="bioText"
            value={data.bioText}
            onChange={(e) => setData({ ...data, bioText: e.target.value })}
            placeholder="Write the full biography or historical context..."
            className="min-h-[200px]"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/content/legacy-gallery')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? 'Save Changes' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
