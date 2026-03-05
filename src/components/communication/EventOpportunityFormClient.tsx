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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EVENT_CATEGORIES = [
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'LECTURE', label: 'Lecture' },
  { value: 'COLLOQUIUM', label: 'Colloquium' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'THESIS_DEFENSE', label: 'Thesis Defense' },
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'SYMPOSIUM', label: 'Symposium' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'OUTREACH', label: 'Outreach' },
  { value: 'COMPETITION', label: 'Competition' },
];

const OPPORTUNITY_CATEGORIES = [
  { value: 'GRANT', label: 'Grant' },
  { value: 'FUNDING', label: 'Funding' },
  { value: 'FELLOWSHIP', label: 'Fellowship' },
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
  { value: 'JOBS', label: 'Jobs' },
  { value: 'INTERNSHIPS', label: 'Internships' },
  { value: 'EXCHANGE', label: 'Exchange' },
  { value: 'COLLABORATION', label: 'Collaboration' },
];

type FormInitial = {
  id?: string;
  title?: string;
  kind?: string;
  eventCategory?: string | null;
  opportunityCategory?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
  linkUrl?: string | null;
  deadline?: string | null;
};

function toDateInput(val?: string | Date | null): string {
  if (!val) return '';
  const d = typeof val === 'string' ? new Date(val) : val;
  return d.toISOString().split('T')[0];
}

export function EventOpportunityFormClient({ initial }: { initial?: FormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || '');
  const [kind, setKind] = useState(initial?.kind || '');
  const [eventCategory, setEventCategory] = useState(initial?.eventCategory || '');
  const [opportunityCategory, setOpportunityCategory] = useState(
    initial?.opportunityCategory || '',
  );
  const [description, setDescription] = useState(initial?.description || '');
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [venue, setVenue] = useState(initial?.venue || '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl || '');
  const [deadline, setDeadline] = useState(toDateInput(initial?.deadline));

  const categoryOptions =
    kind === 'EVENT' ? EVENT_CATEGORIES : kind === 'OPPORTUNITY' ? OPPORTUNITY_CATEGORIES : [];

  const handleKindChange = (val: string) => {
    setKind(val);
    setEventCategory('');
    setOpportunityCategory('');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          title,
          kind: kind as 'EVENT' | 'OPPORTUNITY',
          eventCategory: kind === 'EVENT' && eventCategory ? (eventCategory as never) : null,
          opportunityCategory:
            kind === 'OPPORTUNITY' && opportunityCategory ? (opportunityCategory as never) : null,
          description: description || '',
          startDate: startDate || '',
          endDate: endDate || '',
          venue: venue || '',
          linkUrl: linkUrl || '',
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Kind</Label>
          <Select value={kind} onValueChange={handleKindChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EVENT">Event</SelectItem>
              <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Category</Label>
          <Select
            value={kind === 'EVENT' ? eventCategory : opportunityCategory}
            onValueChange={(val) =>
              kind === 'EVENT' ? setEventCategory(val) : setOpportunityCategory(val)
            }
            disabled={!kind}
          >
            <SelectTrigger>
              <SelectValue placeholder={kind ? 'Select category' : 'Select kind first'} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the event or opportunity..."
          rows={4}
          maxLength={4000}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label htmlFor="linkUrl">Link URL</Label>
          <Input
            id="linkUrl"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEditing ? 'Update' : 'Create Draft'}
        </Button>
      </div>
    </form>
  );
}
