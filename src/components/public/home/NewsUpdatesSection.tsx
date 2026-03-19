import Link from 'next/link';
import Image from 'next/image';

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  date: Date;
  imageUrl: string | null;
}

function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function NewsUpdatesSection({ items }: { items: NewsItem[] }) {
  return (
    <section className="py-20 bg-brand-navy">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-white">News Updates</h2>
          <Link
            href="/news"
            className="text-sm font-semibold text-brand-white border border-brand-white px-5 py-2 hover:bg-brand-white hover:text-brand-navy transition-colors"
          >
            VIEW ALL
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-white/60 text-center py-10">No news updates yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white overflow-hidden flex flex-col group">
                {/* Image area */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  {/* Date */}
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {new Date(item.date).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </p>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-brand-navy mb-2 line-clamp-3">
                    {item.title}
                  </h3>

                  {/* Body preview */}
                  {item.body && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {toPlainText(item.body)}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="mt-auto pt-2">
                    <Link
                      href={`/news/${item.slug}`}
                      className="text-sm font-semibold text-brand-navy hover:text-brand-yellow transition-colors"
                    >
                      Learn More →
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
