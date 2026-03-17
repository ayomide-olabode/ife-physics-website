'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  years: Array<{ year: number; entries: HistoryEntryDTO[] }>;
};

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function initialSelectedYears(decades: DecadeGroup[]): Record<string, number> {
  return decades.reduce<Record<string, number>>((acc, decade) => {
    acc[decade.decadeKey] = decade.years[0]?.year ?? 0;
    return acc;
  }, {});
}

export function HistoryTimeline({ decades }: { decades: DecadeGroup[] }) {
  const [activeDecadeKey, setActiveDecadeKey] = useState(decades[0]?.decadeKey ?? '');
  const [cardsPerView, setCardsPerView] = useState(1);
  const [selectedYearByDecade, setSelectedYearByDecade] = useState<Record<string, number>>(() =>
    initialSelectedYears(decades),
  );
  const [pageByDecadeYear, setPageByDecadeYear] = useState<Record<string, number>>({});

  const railRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth >= 1024) {
        setCardsPerView(3);
        return;
      }
      if (window.innerWidth >= 768) {
        setCardsPerView(2);
        return;
      }
      setCardsPerView(1);
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    const observed = decades
      .map((decade) => document.getElementById(`decade-${decade.decadeKey}`))
      .filter((el): el is HTMLElement => Boolean(el));

    if (observed.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - 140) - Math.abs(b.boundingClientRect.top - 140),
          );

        const top = visible[0];
        if (!top?.target?.id) return;
        const decadeKey = top.target.id.replace('decade-', '');
        setActiveDecadeKey(decadeKey);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0.35 },
    );

    observed.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [decades]);

  useEffect(() => {
    if (!activeDecadeKey) return;
    railRefs.current[activeDecadeKey]?.scrollIntoView({ block: 'nearest' });
  }, [activeDecadeKey]);

  const scrollToDecade = (decadeKey: string) => {
    setActiveDecadeKey(decadeKey);
    document
      .getElementById(`decade-${decadeKey}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setYearForDecade = (decadeKey: string, year: number) => {
    setSelectedYearByDecade((current) => ({ ...current, [decadeKey]: year }));
    setPageByDecadeYear((current) => ({ ...current, [`${decadeKey}-${year}`]: 0 }));
  };

  const setPageForDecadeYear = (decadeKey: string, year: number, page: number) => {
    setPageByDecadeYear((current) => ({ ...current, [`${decadeKey}-${year}`]: page }));
  };

  const decadesWithActiveYear = useMemo(
    () =>
      decades.map((decade) => {
        const activeYear =
          selectedYearByDecade[decade.decadeKey] ||
          decade.years[0]?.year ||
          decade.years[0]?.year ||
          0;
        const yearGroup =
          decade.years.find((group) => group.year === activeYear) ?? decade.years[0];
        const entries = yearGroup?.entries ?? [];
        const key = `${decade.decadeKey}-${yearGroup?.year ?? activeYear}`;
        const totalPages = Math.max(1, Math.ceil(entries.length / cardsPerView));
        const safePage = Math.min(pageByDecadeYear[key] ?? 0, totalPages - 1);
        const start = safePage * cardsPerView;

        return {
          decade,
          activeYear: yearGroup?.year ?? activeYear,
          entries,
          visibleEntries: entries.slice(start, start + cardsPerView),
          page: safePage,
          totalPages,
        };
      }),
    [cardsPerView, decades, pageByDecadeYear, selectedYearByDecade],
  );

  return (
    <div className="flex gap-12">
      <aside className="hidden lg:block w-52 flex-shrink-0">
        <nav
          className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2"
          aria-label="Decade navigation"
        >
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200" />

            <ul className="relative space-y-6">
              {decades.map((decade) => {
                const isActive = activeDecadeKey === decade.decadeKey;
                return (
                  <li key={decade.decadeKey}>
                    <button
                      ref={(el) => {
                        railRefs.current[decade.decadeKey] = el;
                      }}
                      type="button"
                      onClick={() => scrollToDecade(decade.decadeKey)}
                      className="w-full flex items-center gap-3 group text-left"
                    >
                      <span
                        className={`relative z-10 flex h-4 w-4 items-center justify-center border-2 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'bg-brand-yellow border-brand-yellow'
                            : 'bg-gray-300 border-gray-300'
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isActive ? 'text-brand-navy' : 'text-gray-400 group-hover:text-brand-navy'
                        }`}
                      >
                        {decade.decadeLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>

      <div className="flex-1 min-w-0 space-y-16">
        {decadesWithActiveYear.map(
          ({ decade, activeYear, entries, visibleEntries, page, totalPages }) => {
            const canPrev = page > 0;
            const canNext = page < totalPages - 1;

            return (
              <section
                key={decade.decadeKey}
                id={`decade-${decade.decadeKey}`}
                className="scroll-mt-24 space-y-6"
              >
                <h2 className="text-2xl font-serif font-bold text-brand-navy border-b-2 border-brand-yellow pb-2 inline-block">
                  {decade.decadeLabel}
                </h2>

                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  role="tablist"
                  aria-label={`${decade.decadeLabel} years`}
                >
                  {decade.years.map((yearGroup) => {
                    const isActiveYear = yearGroup.year === activeYear;
                    return (
                      <button
                        key={yearGroup.year}
                        type="button"
                        role="tab"
                        aria-selected={isActiveYear}
                        onClick={() => setYearForDecade(decade.decadeKey, yearGroup.year)}
                        className={`shrink-0 px-4 py-2 text-sm font-semibold border transition-colors ${
                          isActiveYear
                            ? 'bg-brand-navy border-brand-navy text-white'
                            : 'bg-white border-black/10 text-brand-navy hover:bg-gray-50'
                        }`}
                      >
                        {yearGroup.year}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-brand-navy text-white text-sm font-semibold px-4 py-1.5">
                      {activeYear}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPageForDecadeYear(decade.decadeKey, activeYear, Math.max(0, page - 1))
                        }
                        disabled={!canPrev}
                        aria-label={`Previous entries for ${activeYear}`}
                        className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPageForDecadeYear(
                            decade.decadeKey,
                            activeYear,
                            Math.min(totalPages - 1, page + 1),
                          )
                        }
                        disabled={!canNext}
                        aria-label={`Next entries for ${activeYear}`}
                        className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {entries.length === 0 ? (
                    <p className="text-sm text-gray-500 border border-gray-200 bg-white p-6">
                      No entries available for {activeYear}.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleEntries.map((entry) => (
                        <article
                          key={entry.id}
                          className="bg-white border border-gray-200 shadow-sm p-6"
                        >
                          <time className="block text-xs font-semibold uppercase tracking-wider text-brand-yellow mb-2">
                            {formatDate(entry.date)}
                          </time>
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
              </section>
            );
          },
        )}
      </div>
    </div>
  );
}
