'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { createNews, updateNews } from '@/server/actions/news';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type NewsFormData = {
  id?: string;
  title?: string;
  slug?: string;
  body?: string;
  imageUrl?: string | null;
  date?: string;
  buttonLabel?: string | null;
  buttonLink?: string | null;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function NewsFormClient({ initial }: { initial?: NewsFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [body, setBody] = useState(initial?.body || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  );
  const [buttonLabel, setButtonLabel] = useState(initial?.buttonLabel || '');
  const [buttonLink, setButtonLink] = useState(initial?.buttonLink || '');
  const [slugManual, setSlugManual] = useState(isEditing);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) {
      setSlug(slugify(val));
    }
  };

  const handleBodyChange = useCallback((html: string) => {
    setBody(html);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const payload = {
          title,
          slug,
          body,
          imageUrl: imageUrl || '',
          date,
          buttonLabel: buttonLabel || '',
          buttonLink: buttonLink || '',
        };

        if (isEditing && initial?.id) {
          const res = await updateNews(initial.id, payload);
          if (res.success) {
            toastSuccess('Article updated.');
            router.refresh();
          } else {
            toastError(res.error || 'Failed to update article.');
          }
        } else {
          const res = await createNews(payload);
          if (res.success && res.data?.id) {
            toastSuccess('Article created as draft.');
            router.push(`/dashboard/communication/news/${res.data.id}`);
          } else {
            toastError(res.error || 'Failed to create article.');
          }
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Article title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Slug
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugManual(true);
              setSlug(e.target.value);
            }}
            placeholder="article-slug"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buttonLabel">Button Label</Label>
          <Input
            id="buttonLabel"
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
            placeholder="Read More"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buttonLink">Button Link</Label>
          <Input
            id="buttonLink"
            value={buttonLink}
            onChange={(e) => setButtonLink(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Body</Label>
        <RichTextEditor value={body} onChange={handleBodyChange} />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEditing ? 'Update Article' : 'Create Draft'}
        </Button>
      </div>
    </form>
  );
}
