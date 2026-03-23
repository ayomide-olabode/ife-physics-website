'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { submitTestimonial } from '@/server/actions/publicTributes';

interface PublicTributeSubmissionFormProps {
  staffSlug: string;
}

export function PublicTributeSubmissionForm({ staffSlug }: PublicTributeSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [tributeHtml, setTributeHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || isRedirecting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await submitTestimonial({
        staffSlug,
        name,
        relationship,
        tributeHtml,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit tribute.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Tribute submitted successfully. Redirecting to tributes...');
      setIsRedirecting(true);
      window.location.assign(`/people/staff/${staffSlug}?tab=tributes&submitted=1`);
    } catch {
      setErrorMessage('Failed to submit tribute. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-md border bg-card p-6">
      <div className="space-y-2">
        <FieldLabel htmlFor="name">Name*</FieldLabel>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          placeholder="Your full name"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="relationship">Relationship*</FieldLabel>
        <Input
          id="relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          required
          maxLength={120}
          placeholder="E.g., Former student, colleague, family friend"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Tribute*</FieldLabel>
        <RichTextEditor value={tributeHtml} onChange={setTributeHtml} />
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Link href={`/people/staff/${staffSlug}?tab=tributes`}>
          <Button type="button" variant="outline" disabled={isSubmitting || isRedirecting}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting || isRedirecting}>
          {isSubmitting || isRedirecting ? 'Submitting...' : 'Submit Tribute'}
        </Button>
      </div>
    </form>
  );
}
