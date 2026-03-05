'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LogOut } from 'lucide-react';
import { useDashboardShortcuts } from './useDashboardShortcuts';

export type NavItem = {
  label: string;
  href: string;
};

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <Link
      href={item.href}
      className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {item.label}
    </Link>
  );
}

export function DashboardSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 py-6 pr-6 border-r min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 flex flex-col gap-1">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="mt-auto pt-6 flex flex-col gap-2">
        <p className="px-3 text-xs text-muted-foreground font-mono">Shortcut: Ctrl+Alt+M</p>
        <LogoutButton
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </LogoutButton>
      </div>
    </aside>
  );
}

export function MobileSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useDashboardShortcuts(() => setOpen((prev) => !prev));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4 flex flex-col">
        <nav className="flex-1 flex flex-col gap-1 mt-6">
          {items.map((item) => (
            <div key={item.href} onClick={() => setOpen(false)}>
              <NavLink item={item} pathname={pathname} />
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-6 flex flex-col gap-2">
          <p className="px-3 text-xs text-muted-foreground font-mono">Shortcut: Ctrl+Alt+M</p>
          <LogoutButton
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </LogoutButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
