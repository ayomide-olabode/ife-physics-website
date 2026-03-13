import Link from 'next/link';

interface EventItem {
  id: string;
  title: string;
  type: string;
  eventCategory: string | null;
  opportunityCategory: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
  linkUrl: string | null;
}

function formatMonth(date: Date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatDay(date: Date) {
  return new Date(date).getDate().toString().padStart(2, '0');
}

export function UpcomingEventsSection({ items }: { items: EventItem[] }) {
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

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No upcoming events. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 overflow-hidden flex flex-col">
                {/* Image placeholder with date badge */}
                <div className="relative h-48 bg-gray-100">
                  {/* Date badge */}
                  {item.startDate && (
                    <div className="absolute top-4 left-4 bg-brand-navy text-brand-white text-center min-w-[56px] shadow">
                      <div className="text-xs font-semibold px-2 pt-2">
                        {formatMonth(item.startDate)}
                      </div>
                      <div className="text-2xl font-bold px-2 pb-2">
                        {formatDay(item.startDate)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  {/* Category */}
                  <p className="text-xs font-semibold text-brand-yellow uppercase tracking-wider mb-2">
                    {item.eventCategory || item.opportunityCategory || item.type}
                  </p>

                  {/* Title */}
                  <h3 className="font-semibold text-brand-navy leading-snug mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                  )}

                  {/* Venue */}
                  {item.venue && <p className="text-xs text-gray-500 mb-4">📍 {item.venue}</p>}

                  {/* CTA */}
                  <div className="mt-auto">
                    <Link
                      href={item.linkUrl || '/events'}
                      className="inline-block text-sm font-semibold text-brand-navy border border-brand-navy px-4 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
                    >
                      MORE INFORMATION
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
