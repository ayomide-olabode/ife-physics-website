import { listPublicHistoryEntries } from '@/server/public/queries/historyPublic';
import { Timeline } from '@/components/public/about/Timeline';

export default async function HistoryPage() {
  const entries = await listPublicHistoryEntries();

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-brand-navy mb-3">Our History</h1>
        <p className="text-gray-600 mb-10 max-w-2xl">
          A timeline of key milestones in the Department of Physics and Engineering Physics.
        </p>

        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No history entries published yet. Check back soon.
            </p>
          </div>
        ) : (
          <Timeline entries={entries} />
        )}
      </div>
    </div>
  );
}
