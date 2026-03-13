import Link from 'next/link';
import Image from 'next/image';
import { listPublicNews } from '@/server/public/queries/newsPublic';

export default async function NewsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 9;

  const { items, totalPages } = await listPublicNews({ page, pageSize });

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-serif font-bold text-brand-navy mb-3">News</h1>
        <p className="text-gray-600 mb-10 max-w-2xl">
          Stay up to date with the latest news and announcements from the Department of Physics and
          Engineering Physics.
        </p>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No news articles published yet. Check back soon.
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="border border-gray-200 overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
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
                    <h2 className="font-semibold text-brand-navy leading-snug mb-3 line-clamp-3">
                      {item.title}
                    </h2>

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
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-4 mt-12"
                aria-label="News pagination"
              >
                {page > 1 && (
                  <Link
                    href={`/news?page=${page - 1}`}
                    className="text-sm font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/news?page=${page + 1}`}
                    className="text-sm font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
