import {
  CoordinatorCoursesMap,
  CourseStatisticsCourse,
  CourseStatisticsCoordinatorName,
  CourseStatisticsCoordinatorRecord,
} from '@/lib/course-statistics/types';

export const COURSE_STATISTICS_INSTITUTION = {
  department: 'Physics and Engineering Physics',
  faculty: 'Faculty of Science',
  university: 'Obafemi Awolowo University',
} as const;

export const COURSE_STATISTICS_SHEET_METADATA = {
  spreadsheetId: '1sisDevoEp3C_dKT1jAnIc3LaW2TgFxxzfEy-Whbc_uI',
  worksheetName: 'Course Statistics Responses',
} as const;

export const COURSE_STATISTICS_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzhUcHNYLAKAaugzB8xWw2pe9Z9ZyybFm-gcXNLxqaVEjs9-Enz7p_Z96uVubY3OSMP/exec';

const COURSE_STATISTICS_COORDINATOR_COURSES_MAP_RAW: CoordinatorCoursesMap = {
  'Adegoke, A. M.': [
    { code: 'PHY301', title: 'Mathematical Methods of Physics I' },
    { code: 'PHY421', title: 'Relativity' },
  ],
  'Akinlade, G. O.': [
    { code: 'PHY307', title: 'Experimental Physics IIIA' },
    { code: 'PHY311', title: 'Introduction to Astrophysics' },
  ],
  'Akinwunmi, O. O.': [
    { code: 'PHY405', title: 'General Solid State Physics' },
    { code: 'EPH201', title: 'Properties of Materials' },
  ],
  'Amosun, C. K.': [{ code: 'PHY401', title: 'Mathematical Methods of Physics II' }],
  'Ayoola, M. A.': [{ code: 'PHY303', title: 'Electromagnetic Theory I' }],
  'Eleruja, M. A.': [{ code: 'EPH405', title: 'Physical Electronics' }],
  'Fadodun, G. O.': [{ code: 'EPH303', title: 'Intro to Nuclear Reactor Theory' }],
  'Fasakin, O.': [
    { code: 'PHY203', title: 'Electric Circuits & Electronics' },
    { code: 'EPH403', title: 'Nuclear Materials' },
  ],
  'Jegede, O. O.': [{ code: 'PHY431', title: 'Atmospheric Physics' }],
  'Maza, D. D.': [{ code: 'PHY409', title: 'Nuclear & Particle Physics I' }],
  'Olabode, A. O.': [
    { code: 'SLT203', title: 'Physical Laboratory Techniques' },
    { code: 'PHY433', title: 'Solid Earth Physics I' },
  ],
  'Olofinjana, B.': [{ code: 'PHY403', title: 'Statistical Physics' }],
  'Olise, F. S.': [
    { code: 'PHY207', title: 'Experimental Physics IIA' },
    { code: 'PHY309', title: 'Quantum Physics I' },
    { code: 'PHY313', title: 'Introduction to Accelerator Physics' },
  ],
  'Olukotun, S. F.': [{ code: 'PHY205', title: 'Introductory Modern Physics' }],
  'Omotoso, E.': [{ code: 'PHY101', title: 'General Physics I' }],
  'Owoade, O. K.': [
    { code: 'PHY107', title: 'Experimental Physics IA' },
    { code: 'PHY305', title: 'Thermodynamics & Kinetic Theory' },
  ],
  'Sunmonu, L. A.': [{ code: 'PHY201', title: 'Classical Mechanics' }],
  'Taleatu, B. A.': [{ code: 'GLT101', title: 'Hazards & Safety in the Laboratory' }],
  'Tchokossa, P.': [{ code: 'PHY105', title: 'Physics for Biological Science I' }],
};

function sortCoordinatorCoursesMap(input: CoordinatorCoursesMap): CoordinatorCoursesMap {
  const sortedCoordinatorNames = Object.keys(input).sort((left, right) =>
    left.localeCompare(right),
  ) as CourseStatisticsCoordinatorName[];

  const sortedEntries = sortedCoordinatorNames.map((coordinatorName) => {
    const sortedCourses = [...input[coordinatorName]].sort((left, right) => {
      if (left.code === right.code) {
        return left.title.localeCompare(right.title);
      }

      return left.code.localeCompare(right.code);
    });

    return [coordinatorName, sortedCourses] as const;
  });

  return Object.fromEntries(sortedEntries) as CoordinatorCoursesMap;
}

export const COURSE_STATISTICS_COORDINATOR_COURSES_MAP = sortCoordinatorCoursesMap(
  COURSE_STATISTICS_COORDINATOR_COURSES_MAP_RAW,
);

export const COURSE_STATISTICS_COURSES_BY_COORDINATOR = COURSE_STATISTICS_COORDINATOR_COURSES_MAP;

export const COURSE_STATISTICS_COORDINATORS = Object.keys(
  COURSE_STATISTICS_COORDINATOR_COURSES_MAP,
) as CourseStatisticsCoordinatorName[];

export const COURSE_STATISTICS_COORDINATOR_RECORDS: readonly CourseStatisticsCoordinatorRecord[] =
  COURSE_STATISTICS_COORDINATORS.map((coordinatorName) => ({
    coordinatorName,
    courses: COURSE_STATISTICS_COORDINATOR_COURSES_MAP[coordinatorName],
  }));

const EMPTY_COURSE_LIST: readonly CourseStatisticsCourse[] = [];

export function getCoursesForCoordinator(coordinatorName: CourseStatisticsCoordinatorName) {
  return COURSE_STATISTICS_COORDINATOR_COURSES_MAP[coordinatorName] || EMPTY_COURSE_LIST;
}
