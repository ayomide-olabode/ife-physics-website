'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HistoryYearEntry {
  id: string;
  dateISO: string;
  title: string;
  shortDesc: string;
}

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function YearCarousel({ entries }: { entries: HistoryYearEntry[] }) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(1);

  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth >= 1024) {
        setPerPage(3);
        return;
      }
      if (window.innerWidth >= 768) {
        setPerPage(2);
        return;
      }
      setPerPage(1);
    };

    updatePerPage();
    window.addEventListener('resize', updatePerPage);
    return () => window.removeEventListener('resize', updatePerPage);
  }, []);

  const totalPages = Math.max(1, Math.ceil(entries.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * perPage;
  const visibleEntries = entries.slice(start, start + perPage);
  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(0, current - 1))}
          disabled={!canPrev}
          aria-label="Previous year entries"
          className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
          disabled={!canNext}
          aria-label="Next year entries"
          className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleEntries.map((entry) => (
          <article
            key={entry.id}
            className="bg-white border border-gray-200 shadow-sm p-6 min-h-[220px]"
          >
            <time className="block text-xs font-semibold uppercase tracking-wider text-brand-yellow mb-2">
              {formatDate(entry.dateISO)}
            </time>
            <h3 className="text-lg font-semibold text-brand-navy leading-snug">{entry.title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-4">
              {entry.shortDesc}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
