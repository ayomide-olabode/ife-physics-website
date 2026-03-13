'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import type { NavItem } from './PublicNavMain';

interface PublicNavMobileProps {
  items: NavItem[];
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isActive(pathname: string, item: { href: string; matchPrefix?: string }): boolean {
  if (item.href === '/') return pathname === '/';
  const prefix = item.matchPrefix ?? item.href;
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

function MobileNavGroup({
  item,
  pathname,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
}) {
  const active = isActive(pathname, item);
  const [expanded, setExpanded] = useState(active);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`
          flex w-full items-center justify-between px-6 py-3 text-sm font-medium tracking-wide transition-colors
          ${active ? 'text-brand-yellow bg-white/5' : 'text-brand-white hover:text-brand-yellow hover:bg-white/5'}
        `}
      >
        <span>{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 opacity-50 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && item.children && (
        <div className="bg-white/5">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className={`
                block pl-10 pr-6 py-2.5 text-sm transition-colors
                ${pathname === child.href ? 'text-brand-yellow' : 'text-white/70 hover:text-brand-yellow'}
              `}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicNavMobile({ items, pathname, open, onOpenChange }: PublicNavMobileProps) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="bg-brand-navy border-brand-navy w-72 p-0 rounded-none">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <SheetTitle className="text-brand-white font-serif text-lg">Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-4" aria-label="Mobile navigation">
          {items.map((item) => {
            if (item.children) {
              return (
                <MobileNavGroup key={item.label} item={item} pathname={pathname} onClose={close} />
              );
            }

            const active = isActive(pathname, item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium tracking-wide transition-colors
                  ${active ? 'text-brand-yellow bg-white/5' : 'text-brand-white hover:text-brand-yellow hover:bg-white/5'}
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile CTA */}
        <div className="mt-auto border-t border-white/10 px-6 py-4 flex flex-col gap-3">
          <Link
            href="#"
            onClick={close}
            className="bg-brand-yellow text-brand-ink text-sm font-semibold px-5 py-2.5 text-center hover:bg-yellow-500 transition-colors"
          >
            Give to Physics
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
