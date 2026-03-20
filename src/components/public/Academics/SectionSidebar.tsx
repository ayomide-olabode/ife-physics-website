'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
}

interface SectionSidebarProps {
  items: SidebarItem[];
  title?: string;
}

export function SectionSidebar({ items, title = 'Table of content' }: SectionSidebarProps) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return items[0]?.id ?? '';
    }

    const hashId = window.location.hash.replace('#', '');
    return items.some((item) => item.id === hashId) ? hashId : (items[0]?.id ?? '');
  });
  const ratiosRef = useRef<Record<string, number>>({});

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!itemIds.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          ratiosRef.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }

        let nextActive = itemIds[0] ?? '';
        let highestRatio = -1;

        for (const id of itemIds) {
          const ratio = ratiosRef.current[id] ?? 0;
          if (ratio > highestRatio) {
            highestRatio = ratio;
            nextActive = id;
          }
        }

        if (highestRatio > 0) {
          setActiveId((previous) => (previous === nextActive ? previous : nextActive));
          history.replaceState(null, '', `#${nextActive}`);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const id of itemIds) {
      const section = document.getElementById(id);
      if (section) {
        observer.observe(section);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [itemIds]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    setActiveId(id);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="sticky top-[120px] w-[260px] border border-brand-navy/15 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy">{title}</h2>

      <nav className="mt-4" aria-label={title}>
        <ul className="space-y-2">
          {items.map((item) => {
            const isActive = item.id === activeId;

            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => handleClick(event, item.id)}
                  className={cn(
                    'block border-l-2 pl-3 text-sm transition-colors duration-200 hover:underline',
                    isActive
                      ? 'border-l-brand-yellow text-brand-navy underline'
                      : 'border-l-transparent text-muted-foreground',
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
