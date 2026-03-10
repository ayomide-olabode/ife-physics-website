'use client';

import * as React from 'react';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { toastSuccess, toastError } from '@/lib/toast';
import { Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import {
  createPostgraduateStudyOption,
  updatePostgraduateStudyOption,
  deletePostgraduateStudyOption,
  fetchStudyOptionDetails,
} from '@/server/actions/postgraduateStudyOptions';
import {
  addCourseToPostgraduateStudyOption,
  removeCourseFromPostgraduateStudyOption,
} from '@/server/actions/postgraduateStudyOptionCourses';
import { PgCourseCodeAutocomplete } from './PgCourseCodeAutocomplete';

type MappedCourse = { id: string; code: string; title: string };

type StudyOptionPreview = {
  id: string;
  name: string;
};

interface PgStudyOptionsInlineEditorProps {
  programmeCode: ProgrammeCode;
  initialOptions: StudyOptionPreview[];
}

export function PgStudyOptionsInlineEditor({
  programmeCode,
  initialOptions,
}: PgStudyOptionsInlineEditorProps) {
  const [options, setOptions] = React.useState<StudyOptionPreview[]>(initialOptions);
  const [searchQuery, setSearchQuery] = React.useState('');

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Editor State
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [mappedCourses, setMappedCourses] = React.useState<MappedCourse[]>([]);

  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    if (id === 'new') {
      setTitle('');
      setDescription('');
      setMappedCourses([]);
      return;
    }

    setIsLoadingDetails(true);
    try {
      const res = await fetchStudyOptionDetails(programmeCode, id);
      if (res.success && res.data) {
        setTitle(res.data.name);
        setDescription(res.data.about || '');
        setMappedCourses(res.data.mappedCourses);
      } else {
        toastError(res.error || 'Failed to load details.');
        setSelectedId(null);
      }
    } catch {
      toastError('Error loading details.');
      setSelectedId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toastError('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedId === 'new') {
        const res = await createPostgraduateStudyOption(programmeCode, {
          name: title,
          about: description,
        });
        if (res.success && res.studyOptionId) {
          toastSuccess('Study option created!');
          setOptions((prev) =>
            [...prev, { id: res.studyOptionId!, name: title }].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          );
          setSelectedId(res.studyOptionId); // Switch to the saved record so courses can be added
        } else {
          toastError(res.error || 'Creation failed');
        }
      } else {
        const res = await updatePostgraduateStudyOption(programmeCode, selectedId!, {
          name: title,
          about: description,
        });
        if (res.success) {
          toastSuccess('Study option updated!');
          setOptions((prev) =>
            prev
              .map((o) => (o.id === selectedId ? { ...o, name: title } : o))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        } else {
          toastError(res.error || 'Update failed');
        }
      }
    } catch {
      toastError('Unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || selectedId === 'new') return;
    if (!confirm('Are you sure you want to delete this study option?')) return;

    setIsSaving(true);
    try {
      const res = await deletePostgraduateStudyOption(programmeCode, selectedId);
      if (res.success) {
        toastSuccess('Study option deleted');
        setOptions((prev) => prev.filter((o) => o.id !== selectedId));
        setSelectedId(null);
      } else {
        toastError(res.error || 'Deletion failed');
      }
    } catch {
      toastError('Unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCourse = async (course: MappedCourse) => {
    if (!selectedId || selectedId === 'new') return; // Cannot map unless saved

    try {
      const res = await addCourseToPostgraduateStudyOption(programmeCode, selectedId, course.id);
      if (res.success) {
        toastSuccess('Course mapped');
        setMappedCourses((prev) => [...prev, course].sort((a, b) => a.code.localeCompare(b.code)));
      } else {
        toastError(res.error || 'Failed to map course');
      }
    } catch {
      toastError('Unexpected error occurred mapping course');
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!selectedId || selectedId === 'new') return;

    try {
      const res = await removeCourseFromPostgraduateStudyOption(
        programmeCode,
        selectedId,
        courseId,
      );
      if (res.success) {
        toastSuccess('Course removed');
        setMappedCourses((prev) => prev.filter((c) => c.id !== courseId));
      } else {
        toastError(res.error || 'Failed to remove course');
      }
    } catch {
      toastError('Unexpected error occurred removing course');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[400px]">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 flex flex-col border rounded-md bg-muted/20">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Study Options</h3>
            <Button size="sm" onClick={() => handleSelect('new')} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter options..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No options found.</div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedId === opt.id
                    ? 'bg-primary/10 text-accent-foreground font-medium'
                    : 'hover:bg-primary/5 hover:text-accent-foreground'
                }`}
              >
                {opt.name}
              </button>
            ))
          )}
          {selectedId === 'new' && (
            <button className="w-full text-left px-3 py-2 text-sm rounded-md bg-primary/10 text-accent-foreground font-medium">
              New Study Option
            </button>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="w-full md:w-2/3 border rounded-md p-6 bg-card flex flex-col overflow-y-auto">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="No Study Option Selected"
              description="Select a study option from the list or create a new one to edit its details and course mappings."
            />
          </div>
        ) : isLoadingDetails ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading details...</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">
                {selectedId === 'new' ? 'Create Study Option' : 'Edit Study Option'}
              </h2>
              {selectedId !== 'new' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={handleDelete}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabel required htmlFor="title">
                  Title
                </FieldLabel>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Theoretical Physics"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this study option..."
                  rows={4}
                  maxLength={4000}
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t flex-1">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Mapped Courses</h3>
                  <p className="text-sm text-muted-foreground">
                    Required courses for this specific study option.
                  </p>
                </div>

                {selectedId === 'new' ? (
                  <div className="bg-muted text-muted-foreground text-sm p-4 rounded-md text-center">
                    Please save the study option first to begin adding courses.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-w-md">
                      <PgCourseCodeAutocomplete
                        programmeCode={programmeCode}
                        excludeIds={mappedCourses.map((c) => c.id)}
                        onSelect={handleAddCourse}
                        placeholder="Type to search and add a course..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {mappedCourses.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No courses mapped.</p>
                      ) : (
                        mappedCourses.map((course) => (
                          <div
                            key={course.id}
                            className="bg-secondary text-secondary-foreground text-sm pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 group"
                          >
                            <span className="font-medium">{course.code}</span>
                            <span className="opacity-75">—</span>
                            <span className="truncate max-w-[200px]">{course.title}</span>
                            <button
                              onClick={() => handleRemoveCourse(course.id)}
                              className="ml-1 opacity-50 hover:opacity-100 hover:text-destructive transition-colors focus:outline-none"
                              aria-label={`Remove ${course.code}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
