'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';
import { PublicNavMobile } from './PublicNavMobile';
import { useState, useRef, useEffect, useCallback } from 'react';

export interface NavItem {
  label: string;
  href: string;
  matchPrefix: string;
  children?: { label: string; href: string }[];
}

export const navItems: NavItem[] = [
  { label: 'HOME', href: '/', matchPrefix: '/' },
  {
    label: 'OUR DEPARTMENT',
    href: '/about',
    matchPrefix: '/about',
    children: [
      { label: 'History', href: '/about/history' },
      { label: 'Leadership', href: '/about/leadership' },
      { label: 'Roll of Honours', href: '/about/roll-of-honour' },
    ],
  },
  {
    label: 'ACADEMICS',
    href: '/academics',
    matchPrefix: '/academics',
    children: [
      { label: 'Undergraduate', href: '/academics/undergraduate' },
      { label: 'Postgraduate', href: '/academics/postgraduate' },
    ],
  },
  { label: 'RESEARCH', href: '/research', matchPrefix: '/research' },
  {
    label: 'PEOPLE',
    href: '/people',
    matchPrefix: '/people',
    children: [
      { label: 'Academic Faculty', href: '/people/academic-faculty' },
      { label: 'Visiting Faculty', href: '/people/visiting-faculty' },
      { label: 'Emeritus', href: '/people/emeritus' },
      { label: 'Retired Faculty', href: '/people/retired-faculty' },
      { label: 'Technical Staff', href: '/people/technical-staff' },
      { label: 'Support Staff', href: '/people/support-staff' },
      { label: 'In Memoriam', href: '/people/in-memoriam' },
    ],
  },
  { label: 'RESOURCES', href: '/resources', matchPrefix: '/resources' },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/';
  return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + '/');
}

/** Desktop dropdown that opens on hover and keyboard focus. */
function NavDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center h-full"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Link
        href={item.href}
        className={`
          flex items-center gap-1 px-4 h-full text-sm font-medium tracking-wide transition-colors
          ${active ? 'bg-brand-yellow text-brand-navy' : 'text-brand-white hover:text-brand-yellow/80'}
        `}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </Link>

      {open && item.children && (
        <div
          className="absolute top-full left-0 z-50 min-w-[200px] bg-white border border-gray-200 shadow-lg py-1"
          role="menu"
        >
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-navy transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicNavMain() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center h-12" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item);

          if (item.children) {
            return <NavDropdown key={item.label} item={item} active={active} />;
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                relative flex items-center gap-1 px-4 h-full text-sm font-medium tracking-wide transition-colors
                ${active ? 'bg-brand-yellow text-brand-navy' : 'text-brand-white hover:text-brand-yellow/80'}
              `}
            >
              {item.label}
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
