import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { isSuperAdmin, hasGlobalRole, getScopedResearchGroupIds } from '@/lib/rbac';
import type { NavItem } from '@/components/dashboard/DashboardSidebar';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Build role-aware nav items server-side
  const navItems: NavItem[] = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Profile', href: '/dashboard/profile/overview' },
  ];

  const isAdmin = isSuperAdmin(session);

  // Communication + Content: EDITOR or superadmin
  if (isAdmin || (await hasGlobalRole(session, 'EDITOR'))) {
    navItems.push({ label: 'Communication', href: '/dashboard/communication' });
    navItems.push({ label: 'Content', href: '/dashboard/content' });
  }

  // Undergraduate + Postgraduate: ACADEMIC_COORDINATOR or superadmin
  if (isAdmin || (await hasGlobalRole(session, 'ACADEMIC_COORDINATOR'))) {
    navItems.push({
      label: 'Undergraduate',
      href: '/dashboard/undergraduate',
      children: [
        { label: 'Physics', href: '/dashboard/undergraduate/phy/overview' },
        { label: 'Engineering Physics', href: '/dashboard/undergraduate/eph/overview' },
        { label: 'Science Laboratory Technology', href: '/dashboard/undergraduate/slt/overview' },
      ],
    });
    navItems.push({
      label: 'Postgraduate',
      href: '/dashboard/postgraduate',
      children: [
        { label: 'Physics', href: '/dashboard/postgraduate/phy/overview' },
        { label: 'Engineering Physics', href: '/dashboard/postgraduate/eph/overview' },
        { label: 'Science Laboratory Technology', href: '/dashboard/postgraduate/slt/overview' },
      ],
    });
  }

  // Research: any RESEARCH_LEAD or superadmin
  if (isAdmin || (await getScopedResearchGroupIds(session)).length > 0) {
    navItems.push({ label: 'Research', href: '/dashboard/research' });
  }

  // Admin: superadmin only
  if (isAdmin) {
    navItems.push({ label: 'Admin', href: '/dashboard/admin' });
  }

  return (
    <>
      <DashboardShell navItems={navItems}>{children}</DashboardShell>
      <Toaster />
    </>
  );
}
