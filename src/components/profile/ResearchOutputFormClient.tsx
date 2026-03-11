'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

/* ── Types ── */

type MetaJson = Record<string, unknown>;

type FormDataState = {
  type?: ResearchOutputType;
  title: string;
  subtitle: string;
  authors: string;
  groupAuthor: string;
  year: string;
  fullDate: string;
  venue: string;
  sourceTitle: string;
  publisher: string;
  url: string;
  doi: string;
  language: string;
  abstract: string;
  notes: string;
  metaJson: MetaJson;
  authorsJson: AuthorObject[];
  keywordsJson: string[];
};

const defaultValues: FormDataState = {
  type: undefined,
  title: '',
  subtitle: '',
  authors: '',
  groupAuthor: '',
  year: '',
  fullDate: '',
  venue: '',
  sourceTitle: '',
  publisher: '',
  url: '',
  doi: '',
  language: '',
  abstract: '',
  notes: '',
  metaJson: {},
  authorsJson: [],
  keywordsJson: [],
};

/* ── Helpers ── */

function meta(form: FormDataState, key: string): string {
  return (form.metaJson[key] as string) || '';
}

function setMeta(prev: FormDataState, key: string, value: string): FormDataState {
  return { ...prev, metaJson: { ...prev.metaJson, [key]: value } };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeStringArray(val: any): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string');
  return [];
}

/* ── Component ── */

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
    fullDate: initialData?.fullDate || '',
    authorsJson: initialData?.authorsJson || [],
    keywordsJson: safeStringArray(initialData?.keywordsJson),
    metaJson: (initialData?.metaJson as MetaJson) || {},
    groupAuthor: initialData?.groupAuthor || '',
    subtitle: initialData?.subtitle || '',
    sourceTitle: initialData?.sourceTitle || '',
    publisher: initialData?.publisher || '',
    language: initialData?.language || '',
    abstract: initialData?.abstract || '',
    notes: initialData?.notes || '',
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualGiven, setManualGiven] = useState('');
  const [manualFamily, setManualFamily] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const t = (formData.type as string) || '';

  /* ── Author helpers ── */

  function syncAuthorsString(authors: AuthorObject[]): string {
    if (authors.length === 0) return formData.authors;
    return authors.map((a) => [a.family_name, a.given_name].filter(Boolean).join(' ')).join(', ');
  }

  function handleAddStaffAuthor(author: AuthorObject) {
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
      toastError('First name is required.');
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

  /* ── Keywords helpers ── */

  function addKeyword(kw: string) {
    const trimmed = kw.trim();
    if (!trimmed) return;
    if (formData.keywordsJson.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, keywordsJson: [...prev.keywordsJson, trimmed] }));
    setKeywordInput('');
  }

  function removeKeyword(index: number) {
    setFormData((prev) => ({
      ...prev,
      keywordsJson: prev.keywordsJson.filter((_, i) => i !== index),
    }));
  }

  /* ── Submit ── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    if (!formData.year && !formData.fullDate) {
      toastError('Year or full date is required');
      return;
    }

    const hasAuthors = formData.authorsJson.length > 0;
    const hasGroup = formData.groupAuthor.trim().length > 0;
    if (!hasAuthors && !hasGroup) {
      toastError('At least one author or group author is required');
      return;
    }

    const yearVal = formData.year
      ? parseInt(formData.year, 10)
      : formData.fullDate
        ? new Date(formData.fullDate).getFullYear()
        : null;

    const payload = {
      type: formData.type as ResearchOutputType,
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      authors: formData.authors || syncAuthorsString(formData.authorsJson),
      authorsJson: formData.authorsJson.length > 0 ? formData.authorsJson : undefined,
      groupAuthor: formData.groupAuthor || undefined,
      year: yearVal,
      fullDate: formData.fullDate || undefined,
      venue: formData.venue || undefined,
      sourceTitle: formData.sourceTitle || undefined,
      publisher: formData.publisher || undefined,
      url: formData.url || undefined,
      doi: formData.doi || undefined,
      language: formData.language || undefined,
      abstract: formData.abstract || undefined,
      notes: formData.notes || undefined,
      keywordsJson: formData.keywordsJson.length > 0 ? formData.keywordsJson : undefined,
      metaJson: Object.keys(formData.metaJson).length > 0 ? formData.metaJson : undefined,
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

  /* ── Shared field builder ── */

  const dis = isSubmitting;

  function metaField(
    key: string,
    label: string,
    opts?: { required?: boolean; placeholder?: string },
  ) {
    return (
      <div className="grid gap-2">
        <FieldLabel required={opts?.required} htmlFor={`meta-${key}`}>
          {label}
        </FieldLabel>
        <Input
          id={`meta-${key}`}
          value={meta(formData, key)}
          onChange={(e) => setFormData((p) => setMeta(p, key, e.target.value))}
          placeholder={opts?.placeholder}
          disabled={dis}
        />
      </div>
    );
  }

  /* ── Render ── */

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-card p-6 border rounded-lg">
      {/* ════════════════════════════════════════════
          SECTION: Output Type + Title
          ════════════════════════════════════════════ */}
      <div className="space-y-4">
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
            disabled={dis}
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
            disabled={dis}
          />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="subtitle">Subtitle</FieldLabel>
          <Input
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="Optional subtitle"
            disabled={dis}
          />
        </div>

        {/* ════════════════════════════════════════════
            SECTION: Authors
            ════════════════════════════════════════════ */}
        <div className="grid gap-3">
          <FieldLabel required>Authors</FieldLabel>

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
                    disabled={dis}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add from staff directory</span>
            </div>
            <StaffAuthorAutocomplete onSelect={handleAddStaffAuthor} disabled={dis} />
          </div>

          {showManualEntry ? (
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Add external author</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <FieldLabel required htmlFor="manual-given" className="text-xs">
                    First Name
                  </FieldLabel>
                  <Input
                    id="manual-given"
                    value={manualGiven}
                    onChange={(e) => setManualGiven(e.target.value)}
                    placeholder="e.g. Jane"
                    disabled={dis}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1">
                  <FieldLabel htmlFor="manual-family" className="text-xs">
                    Last Name
                  </FieldLabel>
                  <Input
                    id="manual-family"
                    value={manualFamily}
                    onChange={(e) => setManualFamily(e.target.value)}
                    placeholder="e.g. Doe"
                    disabled={dis}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleAddManualAuthor} disabled={dis}>
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
                  disabled={dis}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowManualEntry(true)}
              disabled={dis}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add external author manually
            </button>
          )}

          <div className="grid gap-2 pt-1">
            <FieldLabel htmlFor="groupAuthor">Group / Corporate Author</FieldLabel>
            <Input
              id="groupAuthor"
              value={formData.groupAuthor}
              onChange={(e) => setFormData((prev) => ({ ...prev, groupAuthor: e.target.value }))}
              placeholder="e.g. World Health Organization"
              disabled={dis}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════
            SECTION: Date & Year
            ════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <FieldLabel required htmlFor="year">
              Year
            </FieldLabel>
            <YearSelect
              value={formData.year}
              onChange={(val) => setFormData((prev) => ({ ...prev, year: val ? String(val) : '' }))}
              disabled={dis}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="fullDate">Full Date</FieldLabel>
            <Input
              id="fullDate"
              type="date"
              value={formData.fullDate}
              onChange={(e) => {
                const v = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  fullDate: v,
                  year: v ? String(new Date(v).getFullYear()) : prev.year,
                }));
              }}
              disabled={dis}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════
            SECTION: Common fields
            ════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <FieldLabel htmlFor="sourceTitle">Source Title</FieldLabel>
            <Input
              id="sourceTitle"
              value={formData.sourceTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, sourceTitle: e.target.value }))}
              placeholder="e.g. Nature Physics"
              disabled={dis}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="publisher">Publisher</FieldLabel>
            <Input
              id="publisher"
              value={formData.publisher}
              onChange={(e) => setFormData((prev) => ({ ...prev, publisher: e.target.value }))}
              placeholder="e.g. Springer"
              disabled={dis}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <FieldLabel htmlFor="doi">DOI</FieldLabel>
            <Input
              id="doi"
              value={formData.doi}
              onChange={(e) => setFormData((prev) => ({ ...prev, doi: e.target.value }))}
              placeholder="e.g. 10.1038/s41567-024-0..."
              disabled={dis}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="url">URL</FieldLabel>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://..."
              disabled={dis}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <FieldLabel htmlFor="language">Language</FieldLabel>
            <Input
              id="language"
              value={formData.language}
              onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
              placeholder="e.g. English"
              disabled={dis}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════
            SECTION: Type-specific fields
            ════════════════════════════════════════════ */}

        {t === 'JOURNAL_ARTICLE' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Journal Article Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('journal_title', 'Journal Title', {
                required: true,
                placeholder: 'e.g. Journal of Physics',
              })}
              {metaField('volume', 'Volume', { required: true })}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {metaField('issue', 'Issue')}
              {metaField('pages', 'Pages', { placeholder: 'e.g. 100-120' })}
              {metaField('article_number', 'Article No.')}
            </div>
          </fieldset>
        )}

        {t === 'BOOK' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Book Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('edition', 'Edition', { placeholder: 'e.g. 2nd Edition' })}
              {metaField('volume', 'Volume')}
            </div>
          </fieldset>
        )}

        {t === 'BOOK_CHAPTER' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Book Chapter Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('book_title', 'Book Title', {
                required: true,
                placeholder: 'e.g. Advances in Physics',
              })}
              {metaField('editors', 'Editors', { placeholder: 'e.g. Smith J., Doe A.' })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metaField('chapter_pages', 'Chapter Pages', { placeholder: 'e.g. 100-120' })}
            </div>
          </fieldset>
        )}

        {t === 'MONOGRAPH' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Monograph Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('series_title', 'Series Title')}
              {metaField('series_number', 'Series Number')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metaField('edition', 'Edition')}
              {metaField('report_number', 'Report Number')}
            </div>
          </fieldset>
        )}

        {t === 'CONFERENCE_PAPER' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Conference Paper Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('conference_name', 'Conference Name', {
                required: true,
                placeholder: 'e.g. APS March Meeting',
              })}
              <div className="grid gap-2">
                <FieldLabel required htmlFor="meta-presentation_type">
                  Presentation Type
                </FieldLabel>
                <Select
                  value={meta(formData, 'presentation_type') || undefined}
                  onValueChange={(val) => setFormData((p) => setMeta(p, 'presentation_type', val))}
                  disabled={dis}
                >
                  <SelectTrigger id="meta-presentation_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="poster">Poster</SelectItem>
                    <SelectItem value="keynote">Keynote</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="panel">Panel</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {metaField('conference_start_date', 'Start Date')}
              {metaField('conference_end_date', 'End Date')}
              {metaField('conference_location', 'Location', { placeholder: 'e.g. Las Vegas, NV' })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metaField('proceedings_title', 'Proceedings Title')}
              {metaField('pages', 'Pages')}
            </div>
          </fieldset>
        )}

        {t === 'SOFTWARE' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Software Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('software_title', 'Software Title', {
                required: true,
                placeholder: 'e.g. PhySim',
              })}
              {metaField('version', 'Version', { placeholder: 'e.g. v1.0.0' })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metaField('developer', 'Developer')}
              {metaField('platform', 'Platform', { placeholder: 'e.g. Windows, Linux' })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metaField('repository', 'Repository', { placeholder: 'e.g. GitHub, Zenodo' })}
              <div className="grid gap-2">
                <FieldLabel htmlFor="meta-software_type">Software Type</FieldLabel>
                <Select
                  value={meta(formData, 'software_type') || undefined}
                  onValueChange={(val) => setFormData((p) => setMeta(p, 'software_type', val))}
                  disabled={dis}
                >
                  <SelectTrigger id="meta-software_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="library">Library</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="framework">Framework</SelectItem>
                    <SelectItem value="plugin">Plugin</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>
        )}

        {t === 'DATA' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Dataset Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('repository', 'Repository', {
                required: true,
                placeholder: 'e.g. Zenodo, Figshare',
              })}
              {metaField('version', 'Version', { placeholder: 'e.g. v1.0' })}
            </div>
            {metaField('dataset_identifier', 'Dataset Identifier', {
              placeholder: 'e.g. 10.5281/zenodo.1234',
            })}
          </fieldset>
        )}

        {t === 'REPORT' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Report Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('report_number', 'Report Number')}
              {metaField('issuing_organization', 'Issuing Organization', {
                placeholder: 'e.g. Department of Energy',
              })}
            </div>
            {metaField('report_type', 'Report Type', { placeholder: 'e.g. Technical, Annual' })}
          </fieldset>
        )}

        {t === 'PATENT' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Patent Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {metaField('patent_number', 'Patent Number', {
                required: true,
                placeholder: 'e.g. US1234567',
              })}
              {metaField('patent_office', 'Patent Office', {
                required: true,
                placeholder: 'e.g. USPTO',
              })}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {metaField('jurisdiction', 'Jurisdiction', { placeholder: 'e.g. US' })}
              {metaField('filing_date', 'Filing Date')}
              {metaField('issue_date', 'Issue Date')}
            </div>
          </fieldset>
        )}

        {t === 'THESIS' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Thesis Details</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <FieldLabel required htmlFor="meta-degree_type">
                  Degree Type
                </FieldLabel>
                <Select
                  value={meta(formData, 'degree_type') || undefined}
                  onValueChange={(val) => setFormData((p) => setMeta(p, 'degree_type', val))}
                  disabled={dis}
                >
                  <SelectTrigger id="meta-degree_type">
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">B.Sc.</SelectItem>
                    <SelectItem value="msc">M.Sc.</SelectItem>
                    <SelectItem value="mphil">M.Phil.</SelectItem>
                    <SelectItem value="phd">Ph.D.</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {metaField('institution', 'Institution', {
                required: true,
                placeholder: 'e.g. MIT',
              })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metaField('publication_number', 'Publication Number')}
              {metaField('repository', 'Repository')}
            </div>
          </fieldset>
        )}

        {t === 'OTHER' && (
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="text-sm font-semibold px-2">Other Details</legend>
            {metaField('other_type_label', 'Type Label', {
              placeholder: 'e.g. Podcast, Documentary',
            })}
            {metaField('platform', 'Platform')}
          </fieldset>
        )}

        {/* CONFERENCE_PROCEEDINGS – same enum value, no specific subfield requirement */}

        {/* ════════════════════════════════════════════
            SECTION: Keywords
            ════════════════════════════════════════════ */}
        <div className="grid gap-2">
          <FieldLabel>Keywords</FieldLabel>
          {formData.keywordsJson.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.keywordsJson.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-0.5 text-xs"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(idx)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    disabled={dis}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword(keywordInput);
                }
              }}
              placeholder="Type keyword and press Enter"
              disabled={dis}
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addKeyword(keywordInput)}
              disabled={dis}
            >
              Add
            </Button>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            SECTION: Abstract / Notes
            ════════════════════════════════════════════ */}
        <div className="grid gap-2">
          <FieldLabel htmlFor="abstract">Abstract</FieldLabel>
          <Textarea
            id="abstract"
            value={formData.abstract}
            onChange={(e) => setFormData((prev) => ({ ...prev, abstract: e.target.value }))}
            placeholder="Brief abstract…"
            disabled={dis}
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Internal notes…"
            disabled={dis}
            rows={2}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ACTIONS
          ════════════════════════════════════════════ */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/profile/research-outputs')}
          disabled={dis}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={dis}>
          {dis && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Output'}
        </Button>
      </div>
    </form>
  );
}
