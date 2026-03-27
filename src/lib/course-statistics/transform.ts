import {
  COURSE_STATISTICS_INSTITUTION,
  COURSE_STATISTICS_SHEET_METADATA,
} from '@/lib/course-statistics/config';
import {
  CourseStatisticsCourse,
  CourseStatisticsCoordinatorName,
  CourseStatisticsFormValues,
  CourseStatisticsAppsScriptPayload,
  CourseStatisticsSheetRow,
  CourseStatisticsSubmissionCourseRow,
  CourseStatisticsSubmissionPayload,
} from '@/lib/course-statistics/types';

export function sanitizeNumericInput(value: string) {
  return value.replace(/\D/g, '');
}

export function parseOptionalCount(value: string) {
  return value.trim() === '' ? 0 : Number(value);
}

export function buildCourseStatisticsSubmissionPayload(params: {
  coordinatorName: CourseStatisticsCoordinatorName;
  courses: readonly CourseStatisticsCourse[];
  formValues: CourseStatisticsFormValues;
}): CourseStatisticsSubmissionPayload {
  return {
    coordinatorName: params.coordinatorName,
    rows: params.courses.map((course) => {
      const currentValues = params.formValues[course.code];
      const physicsStudents = parseOptionalCount(currentValues?.physicsStudents || '');
      const facultyStudents = parseOptionalCount(currentValues?.facultyStudents || '');
      const otherStudents = parseOptionalCount(currentValues?.otherStudents || '');

      return {
        courseCode: course.code,
        courseTitle: course.title,
        numberOfPhysicsStudents: physicsStudents,
        numberOfFacultyStudents: facultyStudents,
        numberOfOtherStudents: otherStudents,
        totalNumberOfStudents: physicsStudents + facultyStudents + otherStudents,
      };
    }),
  };
}

export function normalizeSubmissionRows(rows: CourseStatisticsSubmissionCourseRow[]) {
  return rows.map((row) => {
    const numberOfPhysicsStudents = Math.max(0, Math.trunc(row.numberOfPhysicsStudents || 0));
    const numberOfFacultyStudents = Math.max(0, Math.trunc(row.numberOfFacultyStudents || 0));
    const numberOfOtherStudents = Math.max(0, Math.trunc(row.numberOfOtherStudents || 0));

    return {
      ...row,
      numberOfPhysicsStudents,
      numberOfFacultyStudents,
      numberOfOtherStudents,
      totalNumberOfStudents:
        numberOfPhysicsStudents + numberOfFacultyStudents + numberOfOtherStudents,
    };
  });
}

export function toCourseStatisticsSheetRows(
  payload: CourseStatisticsSubmissionPayload,
  submittedAt: string,
): CourseStatisticsSheetRow[] {
  return payload.rows.map((row) => ({
    'Time and Date': submittedAt,
    'Name of Course Coordinator': payload.coordinatorName,
    'Course Code': row.courseCode,
    'Course Title': row.courseTitle,
    'Number of Physics Students': row.numberOfPhysicsStudents,
    'Number of Faculty Students': row.numberOfFacultyStudents,
    'Number of Other Students': row.numberOfOtherStudents,
    'Total Number of Students': row.totalNumberOfStudents,
  }));
}

export function toCourseStatisticsAppsScriptPayload(
  payload: CourseStatisticsSubmissionPayload,
  submittedAt: string,
): CourseStatisticsAppsScriptPayload {
  return {
    action: 'replace_all_for_coordinator',
    replaceExistingForCoordinator: true,
    submittedAt,
    coordinatorName: payload.coordinatorName,
    spreadsheetId: COURSE_STATISTICS_SHEET_METADATA.spreadsheetId,
    worksheetName: COURSE_STATISTICS_SHEET_METADATA.worksheetName,
    institution: COURSE_STATISTICS_INSTITUTION,
    rows: toCourseStatisticsSheetRows(payload, submittedAt),
  };
}
