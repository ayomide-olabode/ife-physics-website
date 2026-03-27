export type CourseStatisticsCoordinatorName = string;

export interface CourseStatisticsCourse {
  code: string;
  title: string;
}

export type CoordinatorCoursesMap = Record<
  CourseStatisticsCoordinatorName,
  readonly CourseStatisticsCourse[]
>;

export interface CourseStatisticsCoordinatorRecord {
  coordinatorName: CourseStatisticsCoordinatorName;
  courses: readonly CourseStatisticsCourse[];
}

export interface CourseStatisticsFormValues {
  [courseCode: string]: {
    physicsStudents: string;
    facultyStudents: string;
    otherStudents: string;
  };
}

export interface CourseStatisticsSubmissionCourseRow {
  courseCode: string;
  courseTitle: string;
  numberOfPhysicsStudents: number;
  numberOfFacultyStudents: number;
  numberOfOtherStudents: number;
  totalNumberOfStudents: number;
}

export interface CourseStatisticsSubmissionPayload {
  coordinatorName: CourseStatisticsCoordinatorName;
  rows: CourseStatisticsSubmissionCourseRow[];
}

export interface CourseStatisticsSheetRow {
  'Time and Date': string;
  'Name of Course Coordinator': string;
  'Course Code': string;
  'Course Title': string;
  'Number of Physics Students': number;
  'Number of Faculty Students': number;
  'Number of Other Students': number;
  'Total Number of Students': number;
}

export interface CourseStatisticsAppsScriptPayload {
  action: 'replace_all_for_coordinator';
  replaceExistingForCoordinator: true;
  submittedAt: string;
  coordinatorName: string;
  spreadsheetId: string;
  worksheetName: string;
  institution: {
    department: string;
    faculty: string;
    university: string;
  };
  rows: CourseStatisticsSheetRow[];
}
