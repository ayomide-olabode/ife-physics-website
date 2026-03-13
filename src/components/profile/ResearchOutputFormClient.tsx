'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
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
import { FIELD_MAP } from '@/lib/researchOutputFieldMap';

/* ── Types ── */

type MetaJson = Record<string, unknown>;

type FormDataState = {
  type: ResearchOutputType;
  title: string;
  authors: string;
  groupAuthor: string;
  year: string;
  metaJson: MetaJson;
  authorsJson: AuthorObject[];
  editorsJson: AuthorObject[];
};

const defaultValues: FormDataState = {
  type: ResearchOutputType.JOURNAL_ARTICLE,
  title: '',
  authors: '',
  groupAuthor: '',
  year: '',
  metaJson: {},
  authorsJson: [],
  editorsJson: [],
};

/* ── Helpers ── */

function meta(form: FormDataState, key: string): string {
  return (form.metaJson[key] as string) || '';
}

function setMeta(prev: FormDataState, key: string, value: string): FormDataState {
  return { ...prev, metaJson: { ...prev.metaJson, [key]: value } };
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
    type: initialData?.type || ResearchOutputType.JOURNAL_ARTICLE,
    year: initialData?.year ? String(initialData.year) : '',
    authorsJson: initialData?.authorsJson || [],
    editorsJson:
      ((initialData?.metaJson as Record<string, unknown>)?.editorsJson as AuthorObject[]) || [],
    metaJson: (initialData?.metaJson as MetaJson) || {},
    groupAuthor: initialData?.groupAuthor || '',
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualGiven, setManualGiven] = useState('');
  const [manualFamily, setManualFamily] = useState('');

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

  /* ── Editors helpers ── */
  function handleAddStaffEditor(author: AuthorObject) {
    if (author.staffId && formData.editorsJson.some((a) => a.staffId === author.staffId)) {
      toastError('This staff member is already added.');
      return;
    }
    const updated = [...formData.editorsJson, author];
    setFormData((prev) => ({
      ...prev,
      editorsJson: updated,
    }));
  }

  function handleAddManualEditor() {
    if (!manualGiven.trim()) {
      toastError('First name is required.');
      return;
    }
    const editor: AuthorObject = {
      staffId: null,
      given_name: manualGiven.trim(),
      family_name: manualFamily.trim(),
    };
    const updated = [...formData.editorsJson, editor];
    setFormData((prev) => ({
      ...prev,
      editorsJson: updated,
    }));
    setManualGiven('');
    setManualFamily('');
    setShowManualEntry(false);
  }

  function handleRemoveEditor(index: number) {
    const updated = formData.editorsJson.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      editorsJson: updated,
    }));
  }

  /* ── Submit ── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    if (!formData.year && formData.type !== 'DATA') {
      toastError('Year is required');
      return;
    }

    const hasAuthors = formData.authorsJson.length > 0;
    const hasGroup = formData.groupAuthor.trim().length > 0;
    if (!hasAuthors && !hasGroup) {
      toastError('At least one author or group author is required');
      return;
    }

    const yearVal = formData.year ? parseInt(formData.year, 10) : null;

    // Check required mapped fields
    const mapConfig = FIELD_MAP[formData.type];
    for (const field of mapConfig.fields) {
      if (field.required && !formData.metaJson[field.key]) {
        toastError(`${field.label} is required.`);
        return;
      }
    }

    const metaJsonToSave = { ...formData.metaJson };
    if (mapConfig.hasEditors && formData.editorsJson.length > 0) {
      metaJsonToSave.editorsJson = formData.editorsJson;
    } else {
      delete metaJsonToSave.editorsJson;
    }

    const payload = {
      type: formData.type as ResearchOutputType,
      title: formData.title,
      authors: formData.authors || syncAuthorsString(formData.authorsJson),
      authorsJson: formData.authorsJson.length > 0 ? formData.authorsJson : undefined,
      groupAuthor: formData.groupAuthor || undefined,
      year: yearVal,
      metaJson: Object.keys(metaJsonToSave).length > 0 ? metaJsonToSave : undefined,
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
            SECTION: Type-specific fields
            ════════════════════════════════════════════ */}
        <fieldset className="space-y-4 rounded-md border p-4">
          <legend className="text-sm font-semibold px-2">Output Details</legend>
          <div className="grid grid-cols-2 gap-4">
            {FIELD_MAP[formData.type]?.fields.map((field) => (
              <div key={field.key} className="grid gap-2">
                {metaField(field.key, field.label, { required: field.required })}
              </div>
            ))}
          </div>

          {FIELD_MAP[formData.type]?.hasEditors && (
            <div className="grid gap-3 mt-4 pt-4 border-t">
              <FieldLabel>Editors (Optional)</FieldLabel>
              {formData.editorsJson.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.editorsJson.map((author, idx) => (
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
                      <span>
                        {[author.given_name, author.family_name].filter(Boolean).join(' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditor(idx)}
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
                  <span>Add editor from staff directory</span>
                </div>
                <StaffAuthorAutocomplete onSelect={handleAddStaffEditor} disabled={dis} />
              </div>

              {showManualEntry ? (
                <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Add external editor</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <FieldLabel htmlFor="manual-given" className="text-xs">
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
                    <Button type="button" size="sm" onClick={handleAddManualEditor} disabled={dis}>
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
                  Add external editor manually
                </button>
              )}
            </div>
          )}
        </fieldset>
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
