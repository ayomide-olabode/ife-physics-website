import {
  CourseStatus,
  DegreeType,
  EventCategory,
  EventOpportunityType,
  LeadershipRole,
  OpportunityCategory,
  ProgrammeCode,
  PublishStatus,
  RequirementType,
  ResearchOutputType,
  ScopedRole,
  StaffStatus,
  StaffType,
  ThesisStatus,
} from '@prisma/client';

export const PROGRAMME_OPTIONS = [
  { value: ProgrammeCode.EPH, label: 'Engineering Physics' },
  { value: ProgrammeCode.PHY, label: 'Physics' },
  { value: ProgrammeCode.SLT, label: 'Science Laboratory Technology' },
];

/** Roll-of-Honour programme options – stored as display strings, not enum codes */
export const ROH_PROGRAMME_OPTIONS = [
  { value: 'Engineering Physics', label: 'Engineering Physics' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Science Laboratory Technology', label: 'Science Laboratory Technology' },
] as const;

export const ROH_PROGRAMME_VALUES = ROH_PROGRAMME_OPTIONS.map((o) => o.value);

export const DEGREE_OPTIONS = [
  { value: DegreeType.BSC, label: 'B.Sc.' },
  { value: DegreeType.MPHIL, label: 'M.Phil.' },
  { value: DegreeType.MSC, label: 'M.Sc.' },
  { value: DegreeType.PHD, label: 'Ph.D.' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'ONGOING', label: 'Ongoing' },
];

export const THESIS_STATUS_OPTIONS = [
  { value: ThesisStatus.COMPLETED, label: 'Completed' },
  { value: ThesisStatus.DISCONTINUED, label: 'Discontinued' },
  { value: ThesisStatus.ONGOING, label: 'Ongoing' },
];

export const RESEARCH_OUTPUT_TYPE_OPTIONS = [
  { value: ResearchOutputType.BOOK, label: 'Book' },
  { value: ResearchOutputType.BOOK_CHAPTER, label: 'Book chapter' },
  { value: ResearchOutputType.CONFERENCE_PAPER, label: 'Conference Paper' },
  { value: ResearchOutputType.DATA, label: 'Data' },
  { value: ResearchOutputType.JOURNAL_ARTICLE, label: 'Journal Article' },
  { value: ResearchOutputType.MONOGRAPH, label: 'Monograph' },
  { value: ResearchOutputType.OTHER, label: 'Other' },
  { value: ResearchOutputType.PATENT, label: 'Patent' },
  { value: ResearchOutputType.REPORT, label: 'Report' },
  { value: ResearchOutputType.SOFTWARE, label: 'Software' },
  { value: ResearchOutputType.THESIS, label: 'Thesis' },
];

export const STAFF_TYPE_OPTIONS = [
  { value: StaffType.ACADEMIC, label: 'Academic' },
  { value: StaffType.COGNATE, label: 'Cognate' },
  { value: StaffType.EMERITUS, label: 'Emeritus' },
  { value: StaffType.SUPPORT, label: 'Support' },
  { value: StaffType.TECHNICAL, label: 'Technical' },
  { value: StaffType.VISITING, label: 'Visiting' },
];

export const STAFF_STATUS_OPTIONS = [
  { value: StaffStatus.ACTIVE, label: 'Active' },
  { value: StaffStatus.IN_MEMORIAM, label: 'In Memoriam' },
  { value: StaffStatus.RESIGNED, label: 'Resigned' },
  { value: StaffStatus.RETIRED, label: 'Retired' },
];

export const PUBLISH_STATUS_OPTIONS = [
  { value: PublishStatus.ARCHIVED, label: 'Archived' },
  { value: PublishStatus.DRAFT, label: 'Draft' },
  { value: PublishStatus.PUBLISHED, label: 'Published' },
];

export const PUBLISH_STATUS_OPTIONS_WITH_ALL = [
  { value: 'ALL', label: 'All Statuses' },
  ...PUBLISH_STATUS_OPTIONS,
];

export const COURSE_STATUS_OPTIONS = [
  { value: CourseStatus.CORE, label: 'Core' },
  { value: CourseStatus.RESTRICTED, label: 'Restricted' },
];
export const EVENT_OPPORTUNITY_TYPE_OPTIONS = [
  { value: EventOpportunityType.EVENT, label: 'Event' },
  { value: EventOpportunityType.OPPORTUNITY, label: 'Opportunity' },
];

export const EVENT_CATEGORY_OPTIONS = [
  { value: EventCategory.COLLOQUIUM, label: 'Colloquium' },
  { value: EventCategory.COMPETITION, label: 'Competition' },
  { value: EventCategory.CONFERENCE, label: 'Conference' },
  { value: EventCategory.LECTURE, label: 'Lecture' },
  { value: EventCategory.MEETING, label: 'Meeting' },
  { value: EventCategory.OUTREACH, label: 'Outreach' },
  { value: EventCategory.SCHOOL, label: 'School' },
  { value: EventCategory.SEMINAR, label: 'Seminar' },
  { value: EventCategory.SOCIAL, label: 'Social' },
  { value: EventCategory.SYMPOSIUM, label: 'Symposium' },
  { value: EventCategory.THESIS_DEFENSE, label: 'Thesis Defense' },
  { value: EventCategory.TRAINING, label: 'Training' },
  { value: EventCategory.WORKSHOP, label: 'Workshop' },
];

export const OPPORTUNITY_CATEGORY_OPTIONS = [
  { value: OpportunityCategory.COLLABORATION, label: 'Collaboration' },
  { value: OpportunityCategory.EXCHANGE, label: 'Exchange' },
  { value: OpportunityCategory.FELLOWSHIP, label: 'Fellowship' },
  { value: OpportunityCategory.FUNDING, label: 'Funding' },
  { value: OpportunityCategory.GRANT, label: 'Grant' },
  { value: OpportunityCategory.INTERNSHIPS, label: 'Internships' },
  { value: OpportunityCategory.JOBS, label: 'Jobs' },
  { value: OpportunityCategory.SCHOLARSHIP, label: 'Scholarship' },
];
export const REQUIREMENT_TYPE_OPTIONS = [
  { value: RequirementType.ADMISSION, label: 'Admission' },
  { value: RequirementType.COURSE, label: 'Course' },
];

export const SCOPED_ROLE_OPTIONS = [
  { value: ScopedRole.ACADEMIC_COORDINATOR, label: 'Academic Coordinator (Global)' },
  { value: ScopedRole.EDITOR, label: 'Editor (Global)' },
  { value: ScopedRole.RESEARCH_LEAD, label: 'Research Lead (Scoped)' },
];

export const LEADERSHIP_ROLE_OPTIONS = [
  { value: LeadershipRole.ACADEMIC_COORDINATOR, label: 'Academic Coordinator' },
  { value: LeadershipRole.HOD, label: 'Head of Department' },
];
