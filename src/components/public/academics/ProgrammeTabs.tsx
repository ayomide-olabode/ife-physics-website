'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const UNDERGRADUATE_TABS = [
  { code: 'phy', label: 'Physics' },
  { code: 'eph', label: 'Engineering Physics' },
  { code: 'slt', label: 'Science Laboratory Technology' },
] as const;

const POSTGRADUATE_TABS = [
  { code: 'phy', label: 'Physics' },
  { code: 'eph', label: 'Engineering Physics' },
] as const;

interface ProgrammeTabsProps {
  activeProgrammeCode: 'phy' | 'eph' | 'slt';
  level?: 'undergraduate' | 'postgraduate';
}

export function ProgrammeTabs({
  activeProgrammeCode,
  level = 'undergraduate',
}: ProgrammeTabsProps) {
  const pathname = usePathname();
  const isUndergraduate = level === 'undergraduate';
  const tabs = level === 'postgraduate' ? POSTGRADUATE_TABS : UNDERGRADUATE_TABS;
  const basePath =
    level === 'postgraduate' ? '/academics/postgraduate' : '/academics/undergraduate';

  return (
    <div
      className={cn(
        'w-full',
        isUndergraduate
          ? 'overflow-hidden border border-gray-200 bg-white md:inline-flex md:w-fit md:flex-wrap md:gap-2 md:overflow-visible md:border-0 md:bg-transparent'
          : 'border-b border-brand-navy md:flex md:flex-wrap md:gap-2 md:border-b-0',
      )}
    >
      {tabs.map((tab) => {
        const tabPath = `${basePath}/${tab.code}`;
        const isActive = pathname?.startsWith(tabPath) || tab.code === activeProgrammeCode;

        return (
          <Link
            key={tab.code}
            href={tabPath}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              isUndergraduate
                ? 'block w-full border-b border-gray-200 px-5 py-4 text-base font-semibold uppercase tracking-wide transition-colors last:border-b-0 md:w-fit md:border md:border-brand-navy md:last:border-b md:px-6 md:text-center'
                : 'block w-full border-b border-brand-navy px-6 py-4 text-center text-base font-semibold uppercase tracking-wide transition-colors md:w-fit md:border md:border-brand-navy md:last:border-b',
              isUndergraduate
                ? isActive
                  ? 'bg-brand-navy text-brand-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-brand-navy md:bg-transparent md:text-brand-navy md:hover:bg-brand-navy md:hover:text-brand-white'
                : isActive
                  ? 'bg-brand-navy text-white'
                  : 'bg-white text-brand-navy md:bg-transparent hover:bg-brand-navy hover:text-white',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
