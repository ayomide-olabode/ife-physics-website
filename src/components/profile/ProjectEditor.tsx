'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toastSuccess, toastError } from '@/lib/toast';
import { createMyProject, updateMyProject } from '@/server/actions/profileProjects';
import { useRouter } from 'next/navigation';

type FormDataState = {
  title: string;
  description: string;
  url: string;
};

const defaultValues: FormDataState = {
  title: '',
  description: '',
  url: '',
};

type ProjectEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string } & Partial<FormDataState>;
};

export function ProjectEditor({ open, onOpenChange, initialData }: ProjectEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEdit = !!initialData?.id;

  const [formData, setFormData] = useState<FormDataState>(() => ({
    ...defaultValues,
    ...initialData,
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description || undefined,
      url: formData.url || undefined,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && initialData?.id) {
        res = await updateMyProject(initialData.id, payload);
      } else {
        res = await createMyProject(payload);
      }

      if (res.success) {
        toastSuccess(`Project ${isEdit ? 'updated' : 'added'} successfully.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toastError(res.error || 'Validation failed. Please check your inputs.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of your project.'
              : 'Add a new project or significant initiative to your profile.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Next-Gen Physics Engine"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL Link (Optional)</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief overview of the project and your role..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Maximum 2000 characters.</p>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
