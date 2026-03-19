export const STAFF_PROFILE_TABS = [
  'tributes',
  'bio',
  'research-outputs',
  'projects',
  'student-theses',
  'teaching',
] as const;

export type StaffProfileTab = (typeof STAFF_PROFILE_TABS)[number];

export function isStaffProfileTab(value: string | undefined): value is StaffProfileTab {
  return !!value && STAFF_PROFILE_TABS.includes(value as StaffProfileTab);
}

export function getDefaultStaffProfileTab(isInMemoriam: boolean): StaffProfileTab {
  return isInMemoriam ? 'tributes' : 'bio';
}

export function normalizeStaffProfileTab(
  value: string | undefined,
  isInMemoriam: boolean,
): StaffProfileTab {
  const defaultTab = getDefaultStaffProfileTab(isInMemoriam);
  if (!isStaffProfileTab(value)) return defaultTab;
  if (value === 'tributes' && !isInMemoriam) return 'bio';
  return value;
}

export const STAFF_PROFILE_TAB_LABELS: Record<StaffProfileTab, string> = {
  tributes: 'Tributes',
  bio: 'Bio',
  'research-outputs': 'Research Output',
  projects: 'Projects',
  'student-theses': 'Student Theses',
  teaching: 'Teaching',
};
