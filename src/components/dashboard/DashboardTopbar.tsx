import Link from 'next/link';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserMenu, type TopbarUser } from './UserMenu';
import { MobileSidebar, type NavItem } from './DashboardSidebar';

export async function DashboardTopbar({ navItems }: { navItems: NavItem[] }) {
  const session = await auth();

  let user: TopbarUser = {
    firstName: null,
    lastName: null,
    profileImageUrl: null,
    email: session?.user?.email,
  };

  if (session?.user?.staffId) {
    const staff = await prisma.staff.findUnique({
      where: { id: session.user.staffId },
      select: { firstName: true, lastName: true, profileImageUrl: true, institutionalEmail: true },
    });
    if (staff) {
      user = {
        firstName: staff.firstName,
        lastName: staff.lastName,
        profileImageUrl: staff.profileImageUrl,
        email: session.user.email || staff.institutionalEmail,
        name: staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : null,
        image: staff.profileImageUrl,
      };
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MobileSidebar items={navItems} />
          <Link href="/dashboard" className="font-semibold text-lg tracking-tight">
            OAUIFE Physics
          </Link>
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
