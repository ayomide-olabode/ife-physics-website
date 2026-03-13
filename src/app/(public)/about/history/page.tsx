import { listPublicHistoryEntries } from '@/server/public/queries/historyPublic';
import { PageHero } from '@/components/public/PageHero';
import { HistoryDecadeRail } from '@/components/public/about/HistoryDecadeRail';
import { HistoryTimeline, groupByDecade } from '@/components/public/about/HistoryTimeline';

export default async function HistoryPage() {
  const entries = await listPublicHistoryEntries();
  const groups = groupByDecade(entries);
  const decades = groups.map((g) => g.decade);

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
            <div className="flex gap-12">
              {/* Decade rail – hidden on small screens */}
              <aside className="hidden lg:block w-36 flex-shrink-0">
                <HistoryDecadeRail decades={decades} />
              </aside>

              {/* Timeline content */}
              <div className="flex-1 min-w-0">
                <HistoryTimeline groups={groups} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
