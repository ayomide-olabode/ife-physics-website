import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FeaturedResearchOutput {
  id: string;
  type: string;
  title: string;
  authors: string;
  year: number | null;
  sourceTitle: string | null;
  doi: string | null;
  url: string | null;
  groupName: string;
  groupAbbreviation: string;
  groupSlug: string;
}

export function ResearchOutputsSection({ items }: { items: FeaturedResearchOutput[] }) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-navy">Research Outputs</h2>
          <Link
            href="/research"
            className="text-sm font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
          >
            VIEW ALL
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No featured research outputs yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((pub) => (
              <div key={pub.id} className="bg-white border border-gray-200 p-6 flex flex-col">
                {/* Group + type */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-brand-navy uppercase tracking-wide">
                    {pub.groupAbbreviation || pub.groupName}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {pub.type.toLowerCase().replace('_', ' ')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-brand-navy leading-snug mb-3 line-clamp-3">
                  {pub.title}
                </h3>

                {/* Source / year */}
                {(pub.sourceTitle || pub.year) && (
                  <p className="text-sm text-gray-500 italic mb-2">
                    {pub.sourceTitle}
                    {pub.sourceTitle && pub.year ? `, ${pub.year}` : pub.year}
                  </p>
                )}

                {/* Authors */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{pub.authors}</p>

                {/* CTA */}
                <div className="mt-auto">
                  {pub.url || pub.doi ? (
                    <Link
                      href={pub.url || `https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy border border-brand-navy px-4 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
                    >
                      Read Here <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400">No link available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
