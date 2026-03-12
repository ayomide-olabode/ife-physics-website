'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NavItem {
  label: string;
  href: string;
  matchPrefix: string;
  hasChevron?: boolean;
}

interface PublicNavMobileProps {
  items: NavItem[];
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') {
    return pathname === '/';
  }
  return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + '/');
}

export function PublicNavMobile({ items, pathname, open, onOpenChange }: PublicNavMobileProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="bg-brand-navy border-brand-navy w-72 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <SheetTitle className="text-brand-white font-serif text-lg">Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-4" aria-label="Mobile navigation">
          {items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={`
                  flex items-center justify-between px-6 py-3 text-sm font-medium tracking-wide transition-colors
                  ${active ? 'text-brand-yellow bg-white/5' : 'text-brand-white hover:text-brand-yellow hover:bg-white/5'}
                `}
              >
                <span>{item.label}</span>
                {item.hasChevron && <ChevronDown className="h-4 w-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Mobile utility links */}
        <div className="mt-auto border-t border-white/10 px-6 py-4 flex flex-col gap-3">
          <Link
            href="#"
            onClick={() => onOpenChange(false)}
            className="bg-brand-yellow text-brand-ink text-sm font-semibold px-5 py-2.5 rounded text-center hover:bg-yellow-500 transition-colors"
          >
            Give to Physics
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
