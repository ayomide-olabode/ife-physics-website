import { listPublicHistoryEntries } from '@/server/public/queries/historyPublic';
import { PageHero } from '@/components/public/PageHero';
import {
  HistoryTimeline,
  type HistoryTimelineDecadeGroup,
} from '@/components/public/history/HistoryTimeline';

function groupHistoryEntries(
  entries: Awaited<ReturnType<typeof listPublicHistoryEntries>>,
): HistoryTimelineDecadeGroup[] {
  const decadeMap = new Map<number, Map<number, HistoryTimelineDecadeGroup['years'][number]>>();

  for (const entry of entries) {
    const year = new Date(entry.date).getFullYear();
    const decadeStart = Math.floor(year / 10) * 10;

    if (!decadeMap.has(decadeStart)) {
      decadeMap.set(decadeStart, new Map());
    }

    const yearMap = decadeMap.get(decadeStart)!;
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        id: `year-${year}`,
        year,
        entries: [],
      });
    }

    yearMap.get(year)!.entries.push({
      id: entry.id,
      dateISO: new Date(entry.date).toISOString(),
      title: entry.title,
      shortDesc: entry.shortDesc,
    });
  }

  return Array.from(decadeMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([decadeStart, yearMap]) => ({
      id: `decade-${decadeStart}`,
      decade: `${decadeStart}s`,
      years: Array.from(yearMap.values())
        .sort((a, b) => a.year - b.year)
        .map((yearGroup) => ({
          ...yearGroup,
          entries: [...yearGroup.entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
        })),
    }));
}

export default async function HistoryPage() {
  const entries = await listPublicHistoryEntries();
  const grouped = groupHistoryEntries(entries);

  return (
    <>
      <PageHero breadcrumbLabel="Our Department" title="Our History" />

      <div className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 mb-12 max-w-2xl">
            A timeline of key milestones in the Department of Physics and Engineering Physics.
          </p>

          {entries.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                No history entries published yet. Check back soon.
              </p>
            </div>
          ) : (
            <HistoryTimeline grouped={grouped} />
          )}
        </div>
      </div>
    </>
  );
}
