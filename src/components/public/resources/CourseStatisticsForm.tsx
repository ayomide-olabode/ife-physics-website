'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

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
      setIsConfirmationOpen(false);
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
    setIsConfirmationOpen(false);

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
        body.message || 'Submission received successfully. The form has been cleared.',
      );
      setCoordinatorName('');
      setCountsByCourseCode({});
      setIsConfirmationOpen(true);
    } catch {
      setErrorMessage('Unable to submit right now. Please try again shortly.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 border border-gray-200 bg-white p-6">
        <div className="space-y-2">
          <FieldLabel htmlFor="coordinator-select" required>
            Name of Course Coordinator
          </FieldLabel>
          <Select
            value={coordinatorName}
            disabled={isSubmitting}
            onValueChange={(value) => {
              setCoordinatorName(value);
              setErrorMessage(null);
              setSuccessMessage(null);
              setIsConfirmationOpen(false);
              setHasTriedSubmit(false);
            }}
          >
            <SelectTrigger id="coordinator-select" className="h-11 rounded-none bg-white">
              <SelectValue placeholder="Select a Course Coordinator to load course(s)" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {COURSE_STATISTICS_COORDINATORS.map((coordinator) => (
                <SelectItem key={coordinator} value={coordinator} className="rounded-none">
                  {coordinator}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <p className="font-semibold">NOTE:</p>
          <p>
            <strong>"Physics Students"</strong> are students in Physics (PHY), Engineering Physics
            (EPH), or Science Laboratory Technology (SLT); <strong>"Faculty Students"</strong> are
            students in other departments within the Faculty of Science; and{' '}
            <strong>"Other Students"</strong> are students from faculties outside the Faculty of
            Science.
          </p>
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
                <article key={course.code} className="border border-gray-200 p-4">
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
                        disabled={isSubmitting}
                        className="rounded-none"
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
                        disabled={isSubmitting}
                        onChange={(event) =>
                          updateCounts(course.code, 'facultyStudents', event.target.value, {
                            clearFeedback: true,
                          })
                        }
                        className="rounded-none"
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
                        disabled={isSubmitting}
                        onChange={(event) =>
                          updateCounts(course.code, 'otherStudents', event.target.value, {
                            clearFeedback: true,
                          })
                        }
                        className="rounded-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <FieldLabel htmlFor={totalFieldId}>Total Number of Students</FieldLabel>
                      <Input
                        id={totalFieldId}
                        value={String(totalStudents)}
                        disabled={isSubmitting}
                        readOnly
                        className="rounded-none bg-gray-50"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <span className="font-semibold">Submission error: </span>
            {errorMessage}
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

      <Dialog
        open={isConfirmationOpen}
        onOpenChange={(open) => {
          setIsConfirmationOpen(open);
          if (!open) setSuccessMessage(null);
        }}
      >
        <DialogContent className="rounded-none border-gray-200 p-0 sm:max-w-xl sm:rounded-none [&>button]:hidden">
          <DialogHeader className="space-y-2  p-6 text-left">
            <DialogTitle className="font-serif text-2xl text-brand-navy">
              Submission Confirmed
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700">
              {successMessage || 'Your course statistics submitted successfully.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 pt-0">
            <Button
              type="button"
              onClick={() => {
                setIsConfirmationOpen(false);
                setSuccessMessage(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
