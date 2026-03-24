'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type ThesisItem = {
  id: string;
  title: string;
  degreeLevel: string | null;
  programme: string | null;
  year: number | null;
};

type GroupedYear = {
  key: string;
  label: string;
  items: ThesisItem[];
};

function groupThesesByYear(items: ThesisItem[]): GroupedYear[] {
  const grouped = new Map<string, ThesisItem[]>();

  for (const thesis of items) {
    const key = thesis.year ? String(thesis.year) : 'undated';
    const list = grouped.get(key);
    if (list) {
      list.push(thesis);
    } else {
      grouped.set(key, [thesis]);
    }
  }

  const keys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'undated') return 1;
    if (b === 'undated') return -1;
    return Number(b) - Number(a);
  });

  return keys.map((key) => ({
    key,
    label: key === 'undated' ? 'Undated' : key,
    items: grouped.get(key) || [],
  }));
}

export function StudentThesesByYear({ items }: { items: ThesisItem[] }) {
  const groupedYears = useMemo(() => groupThesesByYear(items), [items]);
  const [openYear, setOpenYear] = useState<string | null>(groupedYears[0]?.key ?? null);

  return (
    <div className="space-y-3">
      {groupedYears.map((group) => {
        const isOpen = openYear === group.key;

        return (
          <div key={group.key} className="border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenYear((prev) => (prev === group.key ? null : group.key))}
              className="flex w-full items-center justify-between bg-brand-navy px-6 py-4 text-left text-white"
            >
              <span className="text-lg font-semibold">{group.label}</span>
              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>

            {isOpen ? (
              <div className="bg-white p-6">
                <div className="space-y-4">
                  {group.items.map((thesis) => (
                    <article key={thesis.id} className="border border-gray-200 p-4">
                      <h3 className="font-semibold text-brand-navy">{thesis.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {thesis.year} •{' '}
                        {[thesis.degreeLevel, thesis.programme].filter(Boolean).join(' • ')}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
