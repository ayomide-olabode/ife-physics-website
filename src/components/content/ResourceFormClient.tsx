'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toastSuccess, toastError } from '@/lib/toast';
import { createResource, updateResource } from '@/server/actions/resources';
import { Loader2 } from 'lucide-react';
import { ResourceFileUploader } from './ResourceFileUploader';

const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(1000),
  linkUrl: z.string().max(1000).optional().nullable(),
  fileUrl: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

export function ResourceFormClient({
  initialData,
}: {
  initialData?: ResourceFormData & { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<ResourceFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    linkUrl: initialData?.linkUrl || '',
    fileUrl: initialData?.fileUrl || '',
    category: initialData?.category || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!data.linkUrl && !data.fileUrl) {
      toastError('Either an external link or a PDF upload is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const parsed = resourceSchema.parse(data);

      if (initialData?.id) {
        await updateResource(initialData.id, parsed);
        toastSuccess('Resource updated successfully!');
      } else {
        await createResource(parsed);
        toastSuccess('Resource created successfully!');
      }

      router.push('/dashboard/content/resources');
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-card p-6 border rounded-lg">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="E.g., 2024 Undergraduate Handbook"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category Type</Label>
          <Input
            id="category"
            value={data.category || ''}
            onChange={(e) => setData({ ...data, category: e.target.value })}
            placeholder="E.g., Handbook, Prospectus, Form, Link"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Short Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="Brief overview of the resource..."
            className="min-h-[100px]"
            disabled={isSubmitting}
            maxLength={1000}
            required
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm">Asset Configuration (Provide at least one)</h3>

          <div className="space-y-2">
            <Label htmlFor="linkUrl">External Link (URL)</Label>
            <Input
              id="linkUrl"
              type="url"
              value={data.linkUrl || ''}
              onChange={(e) => setData({ ...data, linkUrl: e.target.value })}
              placeholder="https://example.com/document"
              disabled={isSubmitting}
            />
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>PDF File Upload</Label>
            <ResourceFileUploader
              value={data.fileUrl}
              onChange={(url) => setData({ ...data, fileUrl: url })}
              onRemove={() => setData({ ...data, fileUrl: '' })}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/content/resources')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? 'Save Changes' : 'Create Resource'}
        </Button>
      </div>
    </form>
  );
}
