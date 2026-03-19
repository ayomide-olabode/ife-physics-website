'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  STAFF_PROFILE_TAB_LABELS,
  STAFF_PROFILE_TABS,
  type StaffProfileTab,
} from '@/components/public/staff-profile/tabConfig';

export function StaffProfileTabs({
  isInMemoriam,
  activeTab,
}: {
  isInMemoriam: boolean;
  activeTab: StaffProfileTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const visibleTabs = STAFF_PROFILE_TABS.filter((tab) => (isInMemoriam ? true : tab !== 'tributes'));

  return (
    <nav className="border border-gray-200 bg-white" aria-label="Profile sections">
      <ul className="flex flex-wrap items-center gap-x-1 px-2 py-1">
        {visibleTabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <li key={tab}>
              <button
                type="button"
                className={[
                  'border-b-2 px-3 py-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-brand-navy text-brand-navy'
                    : 'border-transparent text-gray-500 hover:text-brand-navy',
                ].join(' ')}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', tab);
                  params.delete('page');
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                {STAFF_PROFILE_TAB_LABELS[tab]}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
