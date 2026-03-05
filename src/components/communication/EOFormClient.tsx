'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createEventOpportunity,
  updateEventOpportunity,
} from '@/server/actions/eventsOpportunities';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type EOFormData = {
  id?: string;
  title?: string;
  type?: string;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
  link?: string | null;
  deadline?: string | null;
};

function toDateString(val?: string | Date | null): string {
  if (!val) return '';
  return new Date(val).toISOString().split('T')[0];
}

export function EOFormClient({ initial }: { initial?: EOFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState(initial?.type || 'EVENT');
  const [startDate, setStartDate] = useState(toDateString(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateString(initial?.endDate));
  const [venue, setVenue] = useState(initial?.venue || '');
  const [link, setLink] = useState(initial?.link || '');
  const [deadline, setDeadline] = useState(toDateString(initial?.deadline));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const payload = {
          title,
          type: type as 'EVENT' | 'OPPORTUNITY',
          startDate: startDate || '',
          endDate: endDate || '',
          venue: venue || '',
          link: link || '',
          deadline: deadline || '',
        };

        if (isEditing && initial?.id) {
          const res = await updateEventOpportunity(initial.id, payload);
          if (res.success) {
            toastSuccess('Updated successfully.');
            router.refresh();
          } else {
            toastError(res.error || 'Failed to update.');
          }
        } else {
          const res = await createEventOpportunity(payload);
          if (res.success && res.data?.id) {
            toastSuccess('Created as draft.');
            router.push(`/dashboard/communication/events-opportunities/${res.data.id}`);
          } else {
            toastError(res.error || 'Failed to create.');
          }
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event or opportunity title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EVENT">Event</SelectItem>
              <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>
          <Input
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Location or online"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">Link URL</Label>
        <Input
          id="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEditing ? 'Update' : 'Create Draft'}
        </Button>
      </div>
    </form>
  );
}
