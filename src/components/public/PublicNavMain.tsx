'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';
import { PublicNavMobile } from './PublicNavMobile';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  matchPrefix: string;
  hasChevron?: boolean;
}

const navItems: NavItem[] = [
  { label: 'HOME', href: '/', matchPrefix: '/' },
  { label: 'OUR DEPARTMENT', href: '/about', matchPrefix: '/about', hasChevron: true },
  { label: 'ACADEMICS', href: '/academics', matchPrefix: '/academics', hasChevron: true },
  { label: 'RESEARCH', href: '/research', matchPrefix: '/research' },
  { label: 'PEOPLE', href: '/people', matchPrefix: '/people', hasChevron: true },
  { label: 'RESOURCES', href: '/resources', matchPrefix: '/resources' },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') {
    return pathname === '/';
  }
  return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + '/');
}

export function PublicNavMain() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center h-12 gap-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                relative flex items-center gap-1 px-4 h-full text-sm font-medium tracking-wide transition-colors
                ${active ? 'text-brand-yellow' : 'text-brand-white hover:text-brand-yellow/80'}
              `}
            >
              {item.label}
              {item.hasChevron && <ChevronDown className="h-3.5 w-3.5" />}
              {/* Active bottom border */}
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-yellow rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile hamburger */}
      <div className="lg:hidden flex items-center h-12">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="text-brand-white p-2 -ml-2 hover:text-brand-yellow transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sheet */}
      <PublicNavMobile
        items={navItems}
        pathname={pathname}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />
    </>
  );
}
