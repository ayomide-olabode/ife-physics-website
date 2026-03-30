import Link from 'next/link';

const RESOURCE_ITEMS = [
  { label: 'All Resources', href: '/resources', key: 'resources-home' },
  { label: 'Academic Calendar', href: '/resources/academic-calendar', key: 'academic-calendar' },
  { label: 'Course Statistics', href: '/resources/course-statistics', key: 'course-statistics' },
] as const;

export function ResourcesSidebar({ activeKey }: { activeKey: string }) {
  return (
    <aside className="h-fit border border-gray-200 bg-white">
      <nav aria-label="Resources navigation" className="flex flex-col divide-y divide-gray-200">
        {RESOURCE_ITEMS.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                'px-5 py-4 text-base font-semibold transition-colors',
                isActive
                  ? 'bg-brand-navy text-brand-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-brand-navy',
              ].join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
