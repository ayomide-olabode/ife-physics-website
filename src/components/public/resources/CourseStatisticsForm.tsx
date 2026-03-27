'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COURSE_STATISTICS_COORDINATORS,
  getCoursesForCoordinator,
} from '@/lib/course-statistics/config';
import {
  buildCourseStatisticsSubmissionPayload,
  parseOptionalCount,
  sanitizeNumericInput,
} from '@/lib/course-statistics/transform';
import { CourseStatisticsFormValues } from '@/lib/course-statistics/types';

const EMPTY_COUNTS: CourseStatisticsFormValues[string] = {
  physicsStudents: '',
  facultyStudents: '',
  otherStudents: '',
};

export function CourseStatisticsForm() {
  const [coordinatorName, setCoordinatorName] = useState('');
  const [countsByCourseCode, setCountsByCourseCode] = useState<CourseStatisticsFormValues>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const courses = useMemo(() => getCoursesForCoordinator(coordinatorName), [coordinatorName]);
  const statusMessageId = 'course-statistics-submit-status';

  useEffect(() => {
    if (!coordinatorName) {
      setCountsByCourseCode({});
      return;
    }

    setCountsByCourseCode((previousState) => {
      const nextState: CourseStatisticsFormValues = {};

      for (const course of courses) {
        nextState[course.code] = previousState[course.code] || EMPTY_COUNTS;
      }

      return nextState;
    });
  }, [coordinatorName, courses]);

  const isReadyForSubmit =
    coordinatorName.length > 0 &&
    courses.length > 0 &&
    courses.every((course) => {
      const physicsValue = countsByCourseCode[course.code]?.physicsStudents || '';
      return physicsValue !== '';
    });

  function updateCounts(
    courseCode: string,
    field: keyof CourseStatisticsFormValues[string],
    rawValue: string,
    { clearFeedback = false }: { clearFeedback?: boolean } = {},
  ) {
    const sanitizedValue = sanitizeNumericInput(rawValue);

    setCountsByCourseCode((previousState) => {
      const previousCourseCounts = previousState[courseCode] || EMPTY_COUNTS;

      return {
        ...previousState,
        [courseCode]: {
          ...previousCourseCounts,
          [field]: sanitizedValue,
        },
      };
    });

    if (clearFeedback) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }

  function getCourseCounts(courseCode: string): CourseStatisticsFormValues[string] {
    return countsByCourseCode[courseCode] || EMPTY_COUNTS;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setHasTriedSubmit(true);

    if (!isReadyForSubmit) {
      setErrorMessage('Enter Physics student counts for all listed courses before submitting.');
      setSuccessMessage(null);
      return;
    }

    const payload = buildCourseStatisticsSubmissionPayload({
      coordinatorName,
      courses,
      formValues: countsByCourseCode,
    });

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/course-statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !body?.success) {
        setErrorMessage(body?.message || 'Submission failed. Please try again.');
        return;
      }

      setHasTriedSubmit(false);
      setSuccessMessage(
        body.message ||
          'Submission received successfully. Your current entries remain visible for confirmation.',
      );
    } catch {
      setErrorMessage('Unable to submit right now. Please try again shortly.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      <div className="space-y-2">
        <FieldLabel htmlFor="coordinator-select" required>
          Name of Course Coordinator
        </FieldLabel>
        <Select
          value={coordinatorName}
          onValueChange={(value) => {
            setCoordinatorName(value);
            setErrorMessage(null);
            setSuccessMessage(null);
            setHasTriedSubmit(false);
          }}
        >
          <SelectTrigger id="coordinator-select" className="h-11 bg-white">
            <SelectValue placeholder="Select a coordinator" />
          </SelectTrigger>
          <SelectContent>
            {COURSE_STATISTICS_COORDINATORS.map((coordinator) => (
              <SelectItem key={coordinator} value={coordinator}>
                {coordinator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {coordinatorName && courses.length > 0 && (
        <div className="space-y-4">
          {courses.map((course) => {
            const counts = getCourseCounts(course.code);
            const physicsStudents = parseOptionalCount(counts.physicsStudents);
            const facultyStudents = parseOptionalCount(counts.facultyStudents);
            const otherStudents = parseOptionalCount(counts.otherStudents);
            const totalStudents = physicsStudents + facultyStudents + otherStudents;
            const physicsFieldId = `${course.code}-physics`;
            const facultyFieldId = `${course.code}-faculty`;
            const otherFieldId = `${course.code}-other`;
            const totalFieldId = `${course.code}-total`;
            const isPhysicsMissing = hasTriedSubmit && counts.physicsStudents === '';

            return (
              <article key={course.code} className="rounded-lg border border-gray-200 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-navy">
                    {course.code}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <FieldLabel htmlFor={physicsFieldId} required>
                      Number of Physics Students
                    </FieldLabel>
                    <Input
                      id={physicsFieldId}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={counts.physicsStudents}
                      onChange={(event) =>
                        updateCounts(course.code, 'physicsStudents', event.target.value, {
                          clearFeedback: true,
                        })
                      }
                      required
                      aria-invalid={isPhysicsMissing}
                      aria-describedby={isPhysicsMissing ? `${physicsFieldId}-error` : undefined}
                    />
                    {isPhysicsMissing && (
                      <p id={`${physicsFieldId}-error`} className="text-sm text-red-600">
                        Physics Students is required.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor={facultyFieldId}>Number of Faculty Students</FieldLabel>
                    <Input
                      id={facultyFieldId}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={counts.facultyStudents}
                      onChange={(event) =>
                        updateCounts(course.code, 'facultyStudents', event.target.value, {
                          clearFeedback: true,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor={otherFieldId}>Number of Other Students</FieldLabel>
                    <Input
                      id={otherFieldId}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={counts.otherStudents}
                      onChange={(event) =>
                        updateCounts(course.code, 'otherStudents', event.target.value, {
                          clearFeedback: true,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor={totalFieldId}>Total Number of Students</FieldLabel>
                    <Input
                      id={totalFieldId}
                      value={String(totalStudents)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!coordinatorName && (
        <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Select a course coordinator to load assigned courses.
        </p>
      )}

      <p className="text-sm text-gray-600">
        Faculty Students and Other Students are optional. Empty optional fields are treated as zero.
      </p>

      {!isReadyForSubmit && coordinatorName && (
        <p id={statusMessageId} className="text-sm text-gray-600">
          Complete all required Physics Students fields to enable submission.
        </p>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span className="font-semibold">Submission error: </span>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          <span className="font-semibold">Success: </span>
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-end border-t border-gray-100 pt-4">
        <Button
          type="submit"
          disabled={!isReadyForSubmit || isSubmitting}
          aria-describedby={!isReadyForSubmit && coordinatorName ? statusMessageId : undefined}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Course Statistics'}
        </Button>
      </div>
    </form>
  );
}
