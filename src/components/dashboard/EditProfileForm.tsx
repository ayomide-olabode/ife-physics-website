'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACADEMIC_RANK_OPTIONS, STAFF_TITLE_OPTIONS } from '@/lib/options';
import { updateStaffProfile } from '@/server/actions/profile/update';
import { toastSuccess, toastError } from '@/lib/toast';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { formatShortDate } from '@/lib/format-date';
import { Prose } from '@/components/public/Prose';

function RichTextPreview({ html }: { html: string }) {
  if (!html.trim()) {
    return <p className="text-sm text-muted-foreground">Not provided.</p>;
  }
  return <Prose html={html} className="prose-sm max-w-none" />;
}

export function EditProfileForm({
  initialTitle,
  initialFirstName,
  initialMiddleName,
  initialLastName,
  initialAcademicRank,
  initialDesignation,
  initialBio,
  initialEducation,
  initialResearchInterests,
  initialMembershipOfProfessionalOrganizations,
  lastUpdatedAt,
}: {
  initialTitle?: string | null;
  initialFirstName?: string | null;
  initialMiddleName?: string | null;
  initialLastName?: string | null;
  initialAcademicRank?: string | null;
  initialDesignation?: string | null;
  initialBio?: string | null;
  initialEducation?: string | null;
  initialResearchInterests?: string | null;
  initialMembershipOfProfessionalOrganizations?: string | null;
  lastUpdatedAt?: Date | string | null;
}) {
  const router = useRouter();

  const initialValues = {
    title: initialTitle || '',
    firstName: initialFirstName || '',
    middleName: initialMiddleName || '',
    lastName: initialLastName || '',
    academicRank: initialAcademicRank || '',
    designation: initialDesignation || '',
    bio: initialBio || '',
    education: initialEducation || '',
    researchInterests: initialResearchInterests || '',
    professionalMemberships: initialMembershipOfProfessionalOrganizations || '',
  };

  const [title, setTitle] = useState(initialValues.title);
  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [middleName, setMiddleName] = useState(initialValues.middleName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [academicRank, setAcademicRank] = useState(initialValues.academicRank);
  const [designation, setDesignation] = useState(initialValues.designation);
  const [bio, setBio] = useState(initialValues.bio);
  const [education, setEducation] = useState(initialValues.education);
  const [researchInterests, setResearchInterests] = useState(initialValues.researchInterests);
  const [professionalMemberships, setProfessionalMemberships] = useState(
    initialValues.professionalMemberships,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetToInitial() {
    setTitle(initialValues.title);
    setFirstName(initialValues.firstName);
    setMiddleName(initialValues.middleName);
    setLastName(initialValues.lastName);
    setAcademicRank(initialValues.academicRank);
    setDesignation(initialValues.designation);
    setBio(initialValues.bio);
    setEducation(initialValues.education);
    setResearchInterests(initialValues.researchInterests);
    setProfessionalMemberships(initialValues.professionalMemberships);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title) {
      toastError('Title is required.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toastError('Both first and last names are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateStaffProfile({
        title,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        academicRank,
        designation: designation.trim(),
        bio: bio.trim(),
        education: education.trim(),
        researchInterests: researchInterests.trim(),
        membershipOfProfessionalOrganizations: professionalMemberships.trim(),
      });

      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Profile updated successfully!');
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Last updated: {formatShortDate(lastUpdatedAt ?? null)}
        </p>
        {!isEditing && (
          <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</p>
              <p className="text-sm">{title || 'Not provided.'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">First Name</p>
              <p className="text-sm">{firstName || 'Not provided.'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Middle Name</p>
              <p className="text-sm">{middleName || 'Not provided.'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Name</p>
              <p className="text-sm">{lastName || 'Not provided.'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Academic Rank</p>
              <p className="text-sm">{academicRank || 'Not provided.'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Designation</p>
              <p className="text-sm">{designation || 'Not provided.'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">About Me</p>
            <RichTextPreview html={bio} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Education</p>
            <RichTextPreview html={education} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Research Interests</p>
            <RichTextPreview html={researchInterests} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Membership of Professional Organizations
            </p>
            <RichTextPreview html={professionalMemberships} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel required htmlFor="title">
                  Title
                </FieldLabel>
                <select
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select title</option>
                  {STAFF_TITLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldLabel required htmlFor="firstName">
                  First Name
                </FieldLabel>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                <Input
                  id="middleName"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                  className="rounded-none"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel required htmlFor="lastName">
                  Last Name
                </FieldLabel>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="academicRank">Academic Rank</FieldLabel>
                <select
                  id="academicRank"
                  value={academicRank}
                  onChange={(e) => setAcademicRank(e.target.value)}
                  className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select rank</option>
                  {ACADEMIC_RANK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="designation">Designation</FieldLabel>
                <Input
                  id="designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g., Postgraduate Chairman, Examination Officer..."
                  className="rounded-none"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="bio">About Me</FieldLabel>
              <RichTextEditor value={bio} onChange={setBio} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="education">Education</FieldLabel>
              <RichTextEditor value={education} onChange={setEducation} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="researchInterests">Research Interests</FieldLabel>
              <RichTextEditor value={researchInterests} onChange={setResearchInterests} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="membershipOfProfessionalOrganizations">
                Membership of Professional Organizations
              </FieldLabel>
              <RichTextEditor
                value={professionalMemberships}
                onChange={setProfessionalMemberships}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting} className="rounded-none">
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                resetToInitial();
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
