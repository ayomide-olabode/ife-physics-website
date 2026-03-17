'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type HistoryEntryDTO = {
  id: string;
  date: string;
  year: number;
  decade: string;
  title: string;
  shortDescription: string;
};

export type DecadeGroup = {
  decadeLabel: string;
  decadeKey: string;
  entriesFlat: HistoryEntryDTO[];
};

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function HistoryTimeline({
  decades,
  allEntries,
}: {
  decades: DecadeGroup[];
  allEntries: HistoryEntryDTO[];
}) {
  const [activeDecadeKey, setActiveDecadeKey] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(1);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth >= 1024) return setCardsPerView(3);
      if (window.innerWidth >= 768) return setCardsPerView(2);
      setCardsPerView(1);
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const selectedEntries = useMemo(() => {
    if (activeDecadeKey === 'all') return allEntries;
    return decades.find((d) => d.decadeKey === activeDecadeKey)?.entriesFlat ?? [];
  }, [activeDecadeKey, allEntries, decades]);

  const selectedTitle = useMemo(() => {
    if (activeDecadeKey === 'all') return 'All Periods';
    return decades.find((d) => d.decadeKey === activeDecadeKey)?.decadeLabel ?? 'All Periods';
  }, [activeDecadeKey, decades]);

  const totalPages = Math.max(1, Math.ceil(selectedEntries.length / cardsPerView));
  const safePage = Math.min(pageIndex, totalPages - 1);
  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;
  const visibleEntries = selectedEntries.slice(
    safePage * cardsPerView,
    safePage * cardsPerView + cardsPerView,
  );

  const selectPeriod = (decadeKey: string) => {
    setActiveDecadeKey(decadeKey);
    setPageIndex(0);
  };

  return (
    <div className="flex gap-12">
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <nav
          className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border border-black/10 bg-white"
          aria-label="Decade navigation"
        >
          <div className="p-4 border-b border-black/10">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Decades
            </h3>
          </div>

          <ul className="p-2 space-y-1">
            <li>
              <button
                type="button"
                onClick={() => selectPeriod('all')}
                className={`w-full px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  activeDecadeKey === 'all'
                    ? 'bg-brand-navy text-white'
                    : 'text-gray-500 hover:text-brand-navy hover:bg-gray-50'
                }`}
              >
                All Periods
              </button>
            </li>
            {decades.map((decade) => {
              const isActive = activeDecadeKey === decade.decadeKey;
              return (
                <li key={decade.decadeKey}>
                  <button
                    type="button"
                    onClick={() => selectPeriod(decade.decadeKey)}
                    className={`w-full px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-navy text-white'
                        : 'text-gray-500 hover:text-brand-navy hover:bg-gray-50'
                    }`}
                  >
                    {decade.decadeLabel}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-serif font-bold text-brand-navy border-b-2 border-brand-yellow pb-2 inline-block">
            {selectedTitle}
          </h2>

          {selectedEntries.length > cardsPerView && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                disabled={!canPrev}
                aria-label="Previous history entries"
                className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
                disabled={!canNext}
                aria-label="Next history entries"
                className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {selectedEntries.length === 0 ? (
          <p className="text-sm text-gray-500 border border-gray-200 bg-white p-6">
            No history entries available for this period.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleEntries.map((entry) => (
              <article key={entry.id} className="bg-white border border-black/10 shadow-sm p-6">
                <time className="block text-xs font-semibold uppercase tracking-wider text-brand-yellow mb-2">
                  {formatDate(entry.date)}
                </time>
                <span className="inline-block bg-brand-navy text-white text-xs font-semibold px-2 py-1 mb-3">
                  {entry.year}
                </span>
                <h3 className="text-lg font-semibold text-brand-navy leading-snug">
                  {entry.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-4">
                  {entry.shortDescription}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
