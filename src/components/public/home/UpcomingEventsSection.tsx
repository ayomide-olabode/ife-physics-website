import Link from 'next/link';
import { EventOpportunityGrid } from '@/components/public/events/EventOpportunityGrid';
import type { EventOpportunityItem } from '@/components/public/events/EventOpportunityCard';

export function UpcomingEventsSection({ items }: { items: EventOpportunityItem[] }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-navy">Upcoming Events</h2>
          <Link
            href="/events"
            className="text-sm font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
          >
            VIEW ALL
          </Link>
        </div>

        <EventOpportunityGrid items={items} />
      </div>
    </section>
  );
}
