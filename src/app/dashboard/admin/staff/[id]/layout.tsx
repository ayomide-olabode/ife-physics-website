import { ModuleTabs, type TabItem } from '@/components/dashboard/ModuleTabs';
import { getStaffById } from '@/server/queries/adminStaff';
import { notFound } from 'next/navigation';

export default async function AdminStaffDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await getStaffById(id);
  if (!staff) {
    notFound();
  }

  const basePath = `/dashboard/admin/staff/${id}`;

  const tabs: TabItem[] = [
    { label: 'Overview', href: basePath },
    { label: 'Profile', href: `${basePath}/profile` },
    { label: 'Research Outputs', href: `${basePath}/research-outputs` },
    { label: 'Projects', href: `${basePath}/projects` },
    { label: 'Teaching', href: `${basePath}/teaching` },
    { label: 'Thesis Supervision', href: `${basePath}/thesis-supervision` },
  ];

  return (
    <>
      <ModuleTabs tabs={tabs} />
      {children}
    </>
  );
}
