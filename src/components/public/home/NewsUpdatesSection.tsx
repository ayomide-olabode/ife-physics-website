import Link from 'next/link';
import Image from 'next/image';

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  date: Date;
  imageUrl: string | null;
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
              <div key={item.id} className="bg-white overflow-hidden flex flex-col">
                {/* Image area */}
                <div className="relative h-48 bg-gray-100">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  {/* Date */}
                  <p className="text-xs font-semibold text-brand-yellow uppercase tracking-wider mb-2">
                    {new Date(item.date).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  {/* Title */}
                  <h3 className="font-semibold text-brand-navy leading-snug mb-3 line-clamp-3">
                    {item.title}
                  </h3>

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
