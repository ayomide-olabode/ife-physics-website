import Link from 'next/link';

type ResearchOutputCardProps = {
  groupName: string;
  groupSlug: string;
  outputType: string;
  title: string;
  year: number | null;
  sourceTitle: string | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  authors: string;
};

function formatOutputTypeLabel(value: string): string {
  const customLabels: Record<string, string> = {
    JOURNAL_ARTICLE: 'Article',
    BOOK_CHAPTER: 'Book Chapter',
    CONFERENCE_PAPER: 'Conference Paper',
  };

  if (customLabels[value]) return customLabels[value];
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export function ResearchOutputCard({
  groupName,
  groupSlug,
  outputType,
  title,
  year,
  sourceTitle,
  venue,
  doi,
  url,
  authors,
}: ResearchOutputCardProps) {
  const venueText = sourceTitle || venue;
  const venueWithYear = [venueText, year].filter(Boolean).join(', ');
  const href = doi ? `https://doi.org/${doi}` : url || `/research/${groupSlug}`;
  const isExternal = href.startsWith('http://') || href.startsWith('https://');

  return (
    <article className="group flex h-full flex-col border border-gray-200 bg-white p-8 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-brand-navy">{groupName}</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">{formatOutputTypeLabel(outputType)}</span>
      </div>

      <div className="mt-3 border-t border-gray-200" />

      <h3 className="mt-5 line-clamp-3 text-2xl font-semibold leading-tight text-brand-navy">{title}</h3>

      {venueWithYear ? <p className="mt-4 text-sm italic text-gray-500">{venueWithYear}</p> : null}

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{authors}</p>

      <div className="mt-auto pt-6">
        <Link
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="inline-flex w-fit items-center rounded-none border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy transition-colors duration-300 hover:bg-brand-navy/5"
        >
          Read Here →
        </Link>
      </div>
    </article>
  );
}
