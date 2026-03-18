'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const PROGRAMME_TABS = [
  { code: 'phy', label: 'Physics' },
  { code: 'eph', label: 'Engineering Physics' },
  { code: 'slt', label: 'Science Laboratory Technology' },
] as const;

interface ProgrammeTabsProps {
  activeProgrammeCode: 'phy' | 'eph' | 'slt';
}

export function ProgrammeTabs({ activeProgrammeCode }: ProgrammeTabsProps) {
  return (
    <div className="grid grid-cols-1 border border-brand-navy sm:grid-cols-3">
      {PROGRAMME_TABS.map((tab) => {
        const isActive = tab.code === activeProgrammeCode;

        return (
          <Link
            key={tab.code}
            href={`/academics/undergraduate/${tab.code}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'border-b border-brand-navy px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide transition-colors sm:border-b-0 sm:border-r',
              tab.code === 'slt' && 'sm:border-r-0',
              isActive
                ? 'bg-brand-navy text-white'
                : 'bg-white text-brand-navy hover:bg-brand-navy hover:text-white',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
