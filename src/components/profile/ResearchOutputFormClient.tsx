'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearSelect } from '@/components/forms/YearSelect';
import { RESEARCH_OUTPUT_TYPE_OPTIONS } from '@/lib/options';
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
import { Loader2, X, UserPlus, Plus } from 'lucide-react';
import { StaffAuthorAutocomplete } from '@/components/forms/StaffAuthorAutocomplete';
import type { AuthorObject } from '@/lib/researchOutputTypes';

type FormDataState = {
  type?: ResearchOutputType;
  title: string;
  authors: string;
  year: string;
  venue: string;
  url: string;
  doi: string;
  metaJson: Record<string, string>;
  authorsJson: AuthorObject[];
};

const defaultValues: FormDataState = {
  type: undefined,
  title: '',
  authors: '',
  year: '',
  venue: '',
  url: '',
  doi: '',
  metaJson: {},
  authorsJson: [],
};

export function ResearchOutputFormClient({
  initialData,
}: {
  initialData?: { id: string } & Partial<FormDataState>;
}) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState<FormDataState>(() => ({
    ...defaultValues,
    ...initialData,
    year: initialData?.year ? String(initialData.year) : '',
    authorsJson: initialData?.authorsJson || [],
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualGiven, setManualGiven] = useState('');
  const [manualFamily, setManualFamily] = useState('');

  // Sync authorsJson → flat authors string for backward compatibility
  function syncAuthorsString(authors: AuthorObject[]): string {
    if (authors.length === 0) return formData.authors;
    return authors.map((a) => [a.family_name, a.given_name].filter(Boolean).join(' ')).join(', ');
  }

  function handleAddStaffAuthor(author: AuthorObject) {
    // Prevent duplicates by staffId
    if (author.staffId && formData.authorsJson.some((a) => a.staffId === author.staffId)) {
      toastError('This staff member is already added.');
      return;
    }
    const updated = [...formData.authorsJson, author];
    setFormData((prev) => ({
      ...prev,
      authorsJson: updated,
      authors: syncAuthorsString(updated),
    }));
  }

  function handleAddManualAuthor() {
    if (!manualGiven.trim()) {
      toastError('Given name is required.');
      return;
    }
    const author: AuthorObject = {
      staffId: null,
      given_name: manualGiven.trim(),
      family_name: manualFamily.trim(),
    };
    const updated = [...formData.authorsJson, author];
    setFormData((prev) => ({
      ...prev,
      authorsJson: updated,
      authors: syncAuthorsString(updated),
    }));
    setManualGiven('');
    setManualFamily('');
    setShowManualEntry(false);
  }

  function handleRemoveAuthor(index: number) {
    const updated = formData.authorsJson.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      authorsJson: updated,
      authors: updated.length > 0 ? syncAuthorsString(updated) : prev.authors,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    if (!formData.authors.trim()) {
      toastError('Authors are required');
      return;
    }

    if (!formData.year) {
      toastError('Year is required');
      return;
    }

    const payload = {
      type: formData.type as ResearchOutputType,
      title: formData.title,
      authors: formData.authors,
      year: parseInt(formData.year, 10),
      venue: formData.venue || undefined,
      url: formData.url || undefined,
      doi: formData.doi || undefined,
      metaJson: formData.metaJson,
      authorsJson: formData.authorsJson.length > 0 ? formData.authorsJson : undefined,
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
        if (isEditing) {
          toastSuccess('Changes saved');
        } else {
          toastSuccess('Research output created');
          router.push('/dashboard/profile/research-outputs');
          router.refresh();
        }
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-card p-6 border rounded-lg">
      <div className="space-y-4">
        <div className="grid gap-2">
          <FieldLabel htmlFor="doi">DOI</FieldLabel>
          <Input
            id="doi"
            value={formData.doi}
            onChange={(e) => setFormData((prev) => ({ ...prev, doi: e.target.value }))}
            placeholder="e.g. 10.1038/s41567-024-0..."
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        {/* ── Structured Authors Editor ── */}
        <div className="grid gap-3">
          <FieldLabel required>Authors</FieldLabel>

          {/* Author chips */}
          {formData.authorsJson.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.authorsJson.map((author, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm"
                >
                  {author.staffId && (
                    <span
                      className="h-2 w-2 rounded-full bg-green-500 shrink-0"
                      title="Staff member"
                    />
                  )}
                  <span>{[author.given_name, author.family_name].filter(Boolean).join(' ')}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAuthor(idx)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Staff autocomplete */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add from staff directory</span>
            </div>
            <StaffAuthorAutocomplete onSelect={handleAddStaffAuthor} disabled={isSubmitting} />
          </div>

          {/* Manual author entry */}
          {showManualEntry ? (
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Add external author</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <FieldLabel required htmlFor="manual-given" className="text-xs">
                    Given Name
                  </FieldLabel>
                  <Input
                    id="manual-given"
                    value={manualGiven}
                    onChange={(e) => setManualGiven(e.target.value)}
                    placeholder="e.g. Jane"
                    disabled={isSubmitting}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1">
                  <FieldLabel htmlFor="manual-family" className="text-xs">
                    Family Name
                  </FieldLabel>
                  <Input
                    id="manual-family"
                    value={manualFamily}
                    onChange={(e) => setManualFamily(e.target.value)}
                    placeholder="e.g. Doe"
                    disabled={isSubmitting}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddManualAuthor}
                  disabled={isSubmitting}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowManualEntry(false);
                    setManualGiven('');
                    setManualFamily('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowManualEntry(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add external author manually
            </button>
          )}

          {/* Fallback flat authors field */}
          <div className="grid gap-1">
            <FieldLabel htmlFor="authors" className="text-xs">
              Authors (flat text — auto-synced)
            </FieldLabel>
            <Input
              id="authors"
              value={formData.authors}
              onChange={(e) => setFormData((prev) => ({ ...prev, authors: e.target.value }))}
              required
              placeholder="e.g. Smith J., Doe A."
              disabled={isSubmitting}
              className="text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <FieldLabel required htmlFor="year">
              Year
            </FieldLabel>
            <YearSelect
              value={formData.year}
              onChange={(val) => setFormData((prev) => ({ ...prev, year: val ? String(val) : '' }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="venue">Venue / Journal</FieldLabel>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
              placeholder="e.g. Nature Physics"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Dynamic APA-style fields targeting metaJson */}
        {(formData.type as string) === 'JOURNAL_ARTICLE' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <FieldLabel required htmlFor="journalName">
                Journal Name
              </FieldLabel>
              <Input
                id="journalName"
                value={formData.metaJson.journalName || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, journalName: e.target.value },
                  }))
                }
                placeholder="Journal of Physics"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="volume">Vol.</FieldLabel>
                <Input
                  id="volume"
                  value={formData.metaJson.volume || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, volume: e.target.value },
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="issue">Issue</FieldLabel>
                <Input
                  id="issue"
                  value={formData.metaJson.issue || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, issue: e.target.value },
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="pages">Pages</FieldLabel>
                <Input
                  id="pages"
                  value={formData.metaJson.pages || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, pages: e.target.value },
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}

        {(formData.type as string) === 'CONFERENCE_PAPER' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <FieldLabel required htmlFor="conferenceName">
                Conference Name
              </FieldLabel>
              <Input
                id="conferenceName"
                value={formData.metaJson.conferenceName || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, conferenceName: e.target.value },
                  }))
                }
                placeholder="e.g. APS March Meeting"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                value={formData.metaJson.location || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, location: e.target.value },
                  }))
                }
                placeholder="e.g. Las Vegas, NV"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {(formData.type as string) === 'BOOK' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <FieldLabel required htmlFor="publisher">
                Publisher
              </FieldLabel>
              <Input
                id="publisher"
                value={formData.metaJson.publisher || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, publisher: e.target.value },
                  }))
                }
                placeholder="e.g. Springer"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="edition">Edition</FieldLabel>
              <Input
                id="edition"
                value={formData.metaJson.edition || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, edition: e.target.value },
                  }))
                }
                placeholder="e.g. 2nd Edition"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {(formData.type as string) === 'BOOK_CHAPTER' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <FieldLabel required htmlFor="bookTitle">
                  Book Title
                </FieldLabel>
                <Input
                  id="bookTitle"
                  value={formData.metaJson.bookTitle || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, bookTitle: e.target.value },
                    }))
                  }
                  placeholder="e.g. Advances in Physics"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="editors">Editors</FieldLabel>
                <Input
                  id="editors"
                  value={formData.metaJson.editors || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, editors: e.target.value },
                    }))
                  }
                  placeholder="e.g. Smith J."
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <FieldLabel required htmlFor="publisher">
                  Publisher
                </FieldLabel>
                <Input
                  id="publisher"
                  value={formData.metaJson.publisher || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, publisher: e.target.value },
                    }))
                  }
                  placeholder="e.g. Springer"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="pages">Pages</FieldLabel>
                <Input
                  id="pages"
                  value={formData.metaJson.pages || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, pages: e.target.value },
                    }))
                  }
                  placeholder="e.g. 100-120"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}

        {(formData.type as string) === 'PATENT' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <FieldLabel required htmlFor="patentNumber">
                Patent Number
              </FieldLabel>
              <Input
                id="patentNumber"
                value={formData.metaJson.patentNumber || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, patentNumber: e.target.value },
                  }))
                }
                placeholder="e.g. US1234567"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="issuer">Issuer</FieldLabel>
              <Input
                id="issuer"
                value={formData.metaJson.issuer || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, issuer: e.target.value },
                  }))
                }
                placeholder="e.g. USPTO"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {((formData.type as string) === 'DATA' || (formData.type as string) === 'SOFTWARE') && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <FieldLabel required htmlFor="repository">
                Repository
              </FieldLabel>
              <Input
                id="repository"
                value={formData.metaJson.repository || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, repository: e.target.value },
                  }))
                }
                placeholder="e.g. GitHub, Zenodo"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="version">Version</FieldLabel>
              <Input
                id="version"
                value={formData.metaJson.version || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, version: e.target.value },
                  }))
                }
                placeholder="e.g. v1.0.0"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {(formData.type as string) === 'REPORT' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <FieldLabel required htmlFor="institution">
                Institution
              </FieldLabel>
              <Input
                id="institution"
                value={formData.metaJson.institution || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, institution: e.target.value },
                  }))
                }
                placeholder="e.g. Department of Energy"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="publisher">Publisher (if diff)</FieldLabel>
              <Input
                id="publisher"
                value={formData.metaJson.publisher || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaJson: { ...p.metaJson, publisher: e.target.value },
                  }))
                }
                placeholder="e.g. OUP"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {(formData.type as string) === 'THESIS' && (
          <div className="grid gap-2">
            <FieldLabel required htmlFor="awardingInstitution">
              Awarding Institution
            </FieldLabel>
            <Input
              id="awardingInstitution"
              value={formData.metaJson.awardingInstitution || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  metaJson: { ...p.metaJson, awardingInstitution: e.target.value },
                }))
              }
              placeholder="e.g. MIT"
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="grid gap-2">
          <FieldLabel htmlFor="url">External Link</FieldLabel>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="https://..."
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/profile/research-outputs')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Output'}
        </Button>
      </div>
    </form>
  );
}
