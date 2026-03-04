import { DashboardTopbar } from './DashboardTopbar';
import { DashboardSidebar, type NavItem } from './DashboardSidebar';

export function DashboardShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <DashboardTopbar navItems={navItems} />
      <div className="mx-auto flex w-full max-w-[1440px] px-4 flex-1 min-h-0">
        <DashboardSidebar items={navItems} />
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto py-6 md:pl-6">{children}</main>
      </div>
    </div>
  );
}
