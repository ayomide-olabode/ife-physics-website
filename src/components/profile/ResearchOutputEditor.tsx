'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearSelect } from '@/components/forms/YearSelect';
import { RESEARCH_OUTPUT_TYPE_OPTIONS } from '@/lib/options';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toastSuccess, toastError } from '@/lib/toast';
import {
  createMyResearchOutput,
  updateMyResearchOutput,
} from '@/server/actions/profileResearchOutputs';
import { ResearchOutputType } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultValues = {
  type: undefined as ResearchOutputType | undefined,
  title: '',
  year: '',
  venue: '',
  url: '',
  doi: '',
};

type FormDataState = {
  type?: ResearchOutputType;
  title: string;
  year: string;
  venue: string;
  url: string;
  doi: string;
};

export function ResearchOutputEditor({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string } & Partial<FormDataState>;
}) {
  const isEditing = !!initialData?.id;
  const [formData, setFormData] = useState<FormDataState>(() => ({
    ...defaultValues,
    ...initialData,
    year: initialData?.year ? String(initialData.year) : '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    if (!formData.type) {
      toastError('Type is required');
      return;
    }

    const payload = {
      type: formData.type,
      title: formData.title,
      year: formData.year ? parseInt(formData.year, 10) : undefined,
      venue: formData.venue || undefined,
      url: formData.url || undefined,
      doi: formData.doi || undefined,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing && initialData?.id) {
        res = await updateMyResearchOutput(initialData.id, payload);
      } else {
        res = await createMyResearchOutput(payload);
      }

      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess(isEditing ? 'Output updated!' : 'Output created!');
        onOpenChange(false);
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Research Output' : 'Add Research Output'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details below.' : 'Add a new publication or output.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <FieldLabel htmlFor="doi">DOI</FieldLabel>
              <Input
                id="doi"
                value={formData.doi}
                onChange={(e) => setFormData((prev) => ({ ...prev, doi: e.target.value }))}
                placeholder="e.g. 10.1038/s41567-024-0..."
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel required htmlFor="type">
                Output Type
              </FieldLabel>
              <Select
                value={formData.type}
                onValueChange={(val: string) =>
                  setFormData((prev) => ({ ...prev, type: val as ResearchOutputType }))
                }
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RESEARCH_OUTPUT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <FieldLabel required htmlFor="title">
                Title
              </FieldLabel>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                placeholder="e.g. Quantum Entanglement Mechanics"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <FieldLabel htmlFor="year">Year</FieldLabel>
                <YearSelect
                  value={formData.year}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, year: val ? String(val) : '' }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="venue">Venue / Journal</FieldLabel>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g. Nature Physics"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <FieldLabel htmlFor="url">External Link (optional)</FieldLabel>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Output'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
