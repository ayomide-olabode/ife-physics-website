import { formatDay, formatMonthAbbrev, formatYear, formatShortDate } from '@/lib/format-date';
import { Hourglass } from 'lucide-react';

/** Category abbreviation mapping */
const CATEGORY_ABBREV: Record<string, string> = {
  SEMINAR: 'SEM',
  LECTURE: 'LEC',
  COLLOQUIUM: 'COL',
  WORKSHOP: 'WKS',
  TRAINING: 'TRN',
  THESIS_DEFENSE: 'DEF',
  CONFERENCE: 'CON',
  SYMPOSIUM: 'SYM',
  SCHOOL: 'SCH',
  MEETING: 'MTG',
  SOCIAL: 'SOC',
  OUTREACH: 'OUT',
  COMPETITION: 'CMP',
  GRANT: 'GRN',
  FUNDING: 'FND',
  FELLOWSHIP: 'FEL',
  SCHOLARSHIP: 'SCL',
  JOBS: 'JOB',
  INTERNSHIPS: 'INT',
  EXCHANGE: 'EXC',
  COLLABORATION: 'CLB',
};

function getCategoryAbbrev(category: string | null): string {
  if (!category) return '—';
  return CATEGORY_ABBREV[category] || category.slice(0, 3).toUpperCase();
}

function getCategoryLabel(category: string | null): string {
  if (!category) return '';
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\B\w+/g, (w) => w.toLowerCase());
}

export interface EventOpportunityItem {
  id: string;
  title: string;
  type: string;
  eventCategory: string | null;
  opportunityCategory: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
  deadline: Date | null;
  linkUrl: string | null;
}

export function EventOpportunityCard({ item }: { item: EventOpportunityItem }) {
  const isEvent = item.type === 'EVENT';
  const category = isEvent ? item.eventCategory : item.opportunityCategory;
  const abbrev = getCategoryAbbrev(category);
  const categoryLabel = getCategoryLabel(category);

  const cardContent = (
    <div className="border border-gray-50 bg-[hsl(220,16%,96%)] flex flex-col h-full min-h-[450px]">
      {/* Top: Type label */}
      <div className="px-5 pt-5 pb-3">
        <span className="text-sm font-medium uppercase tracking-widest text-gray-500">
          {isEvent ? 'EVENT' : 'OPPORTUNITY'}
        </span>
      </div>

      <hr className="border-gray-200 mx-5" />

      {/* Category row */}
      <div className="px-5 pt-4 flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-fit h-8 bg-brand-navy text-brand-white text-[10px] font-semibold tracking-widest shrink-0 uppercase px-2">
          {categoryLabel}
        </span>
      </div>

      {/* Title */}
      <div className="px-5 pt-4">
        <h3 className="text-xl font-semibold text-brand-navy leading-snug line-clamp-4">
          {item.title}
        </h3>
      </div>

      {/* Type label below title */}

      {/* Dates block */}
      <div className="px-5 pt-3 space-y-1 text-base text-gray-500">
        {isEvent && item.startDate && (
          <p>
            <span className="font-medium text-gray-600">Starting from: </span>
            {formatShortDate(item.startDate)}
          </p>
        )}
        {isEvent && item.endDate && (
          <p>
            <span className="font-medium text-gray-600">Ending: </span>
            {formatShortDate(item.endDate)}
          </p>
        )}
        {!isEvent && item.startDate && (
          <p>
            <span className="font-medium text-gray-600">Opens: </span>
            {formatShortDate(item.startDate)}
          </p>
        )}
      </div>

      {/* Spacer to push "Apply before" to bottom */}
      <div className="grow" />

      {/* Bottom "Apply before" block */}
      <hr className="border-gray-200 mx-5 mt-4" />
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="items-center space-y-2 text-gray-400">
          <Hourglass className="w-6 h-6" />
          <span className="text-base font-medium">Apply before:</span>
        </div>

        {item.deadline ? (
          <div className="flex items-end gap-2">
            <span className="text-6xl font-bold text-gray-700 leading-none">
              {formatDay(item.deadline)}
            </span>
            <div className="flex flex-col text-right leading-tight pb-1.5">
              <span className="text-2xl font-bold leading-none text-gray-500 uppercase">
                {formatMonthAbbrev(item.deadline)}
              </span>
              <span className="text-2xl text-gray-400 leading-none">
                {formatYear(item.deadline)}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">No deadline</span>
        )}
      </div>
    </div>
  );

  // If link exists, wrap in anchor
  if (item.linkUrl) {
    return (
      <a
        href={item.linkUrl}
        target="_blank"
        rel="noreferrer"
        className="block hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      >
        {cardContent}
      </a>
    );
  }

  return <div className="cursor-default">{cardContent}</div>;
}
