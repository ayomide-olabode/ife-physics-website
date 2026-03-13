import { listPublicEventsOpportunities } from '@/server/public/queries/eventsPublic';
import { EventOpportunityGrid } from '@/components/public/events/EventOpportunityGrid';

export default async function EventsPage() {
  const items = await listPublicEventsOpportunities(12);

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-serif font-bold text-brand-navy mb-3">
          Events &amp; Opportunities
        </h1>
        <p className="text-gray-600 mb-10 max-w-2xl">
          Upcoming events, seminars, workshops, funding opportunities, fellowships, and more from
          the Department of Physics and Engineering Physics.
        </p>

        <EventOpportunityGrid items={items} />
      </div>
    </div>
  );
}
