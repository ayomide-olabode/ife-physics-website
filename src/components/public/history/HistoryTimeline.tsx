'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { YearCarousel, type HistoryYearEntry } from './YearCarousel';

export interface HistoryTimelineDecadeGroup {
  id: string;
  decade: string;
  years: {
    id: string;
    year: number;
    entries: HistoryYearEntry[];
  }[];
}

type TocItem =
  | { kind: 'decade'; id: string; label: string }
  | { kind: 'year'; id: string; label: string; parentDecadeId: string };

export function HistoryTimeline({ grouped }: { grouped: HistoryTimelineDecadeGroup[] }) {
  const [activeYearId, setActiveYearId] = useState<string | null>(grouped[0]?.years[0]?.id ?? null);
  const railItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const tocItems = useMemo<TocItem[]>(
    () =>
      grouped.flatMap((decade) => [
        { kind: 'decade', id: decade.id, label: decade.decade } as const,
        ...decade.years.map(
          (year) =>
            ({
              kind: 'year',
              id: year.id,
              label: String(year.year),
              parentDecadeId: decade.id,
            }) as const,
        ),
      ]),
    [grouped],
  );

  const yearToDecadeMap = useMemo(
    () =>
      grouped.reduce<Record<string, string>>((acc, decade) => {
        for (const year of decade.years) {
          acc[year.id] = decade.id;
        }
        return acc;
      }, {}),
    [grouped],
  );

  const activeDecadeId = activeYearId ? yearToDecadeMap[activeYearId] : grouped[0]?.id;

  useEffect(() => {
    const sections = grouped
      .flatMap((decade) => decade.years.map((year) => document.getElementById(year.id)))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - 120) - Math.abs(b.boundingClientRect.top - 120),
          );

        const topVisible = visible[0];
        if (topVisible?.target?.id) {
          setActiveYearId(topVisible.target.id);
        }
      },
      { root: null, rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [grouped]);

  useEffect(() => {
    const activeId = activeYearId ?? activeDecadeId;
    if (!activeId) return;
    railItemRefs.current[activeId]?.scrollIntoView({ block: 'nearest' });
  }, [activeDecadeId, activeYearId]);

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex gap-12">
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <nav
          className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border border-black/10 bg-white"
          aria-label="History timeline contents"
        >
          <ul className="py-3">
            {tocItems.map((item) => {
              const isDecade = item.kind === 'decade';
              const isActive =
                item.kind === 'year' ? activeYearId === item.id : activeDecadeId === item.id;

              return (
                <li key={item.id}>
                  <button
                    ref={(el) => {
                      railItemRefs.current[item.id] = el;
                    }}
                    type="button"
                    onClick={() => scrollToId(item.id)}
                    className={`w-full text-left px-4 py-2 transition-colors border-l-4 ${
                      isActive
                        ? 'border-l-brand-yellow bg-brand-yellow/10 text-brand-navy'
                        : 'border-l-transparent text-slate-400 hover:bg-slate-50 hover:text-brand-navy'
                    } ${isDecade ? 'text-sm font-semibold' : 'text-xs pl-8 font-medium'}`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 min-w-0 space-y-14">
        {grouped.map((decade) => (
          <section key={decade.id} id={decade.id} className="scroll-mt-24">
            <h2 className="text-2xl font-serif font-bold text-brand-navy mb-8 border-b-2 border-brand-yellow pb-2 inline-block">
              {decade.decade}
            </h2>

            <div className="space-y-10">
              {decade.years.map((yearGroup) => (
                <section
                  key={yearGroup.id}
                  id={yearGroup.id}
                  data-history-year
                  className="scroll-mt-24 space-y-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-block bg-brand-navy text-white text-sm font-semibold px-4 py-1.5">
                      {yearGroup.year}
                    </span>
                  </div>

                  <YearCarousel entries={yearGroup.entries} />
                </section>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
