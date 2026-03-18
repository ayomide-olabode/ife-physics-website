import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TestimonialStatus } from '@prisma/client';
import { requireTributesAccess } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';
import { DepartmentalTributeFormClient } from '@/components/tributes/DepartmentalTributeFormClient';
import { TestimonialsModerationTable } from '@/components/tributes/TestimonialsModerationTable';
import { listTestimonialsForStaff } from '@/server/queries/tributesAdmin';

function parseStatus(value?: string): TestimonialStatus | undefined {
  if (!value) return undefined;
  if (value === 'PENDING' || value === 'APPROVED' || value === 'DECLINED') {
    return value;
  }
  return undefined;
}

export default async function TributeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requireTributesAccess();

  const { id } = await params;
  const query = await searchParams;
  const page = parseInt(query.page || '1', 10);
  const status = parseStatus(query.status);
  const pageSize = 10;

  const staff = await prisma.staff.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      firstName: true,
      middleName: true,
      lastName: true,
      dateOfBirth: true,
      dateOfDeath: true,
      isInMemoriam: true,
      staffStatus: true,
      tribute: {
        select: {
          title: true,
          bodyHtml: true,
        },
      },
    },
  });

  if (!staff) {
    notFound();
  }

  const isInMemoriam = staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM';
  if (!isInMemoriam) {
    notFound();
  }

  const { items, total } = await listTestimonialsForStaff({
    staffId: staff.id,
    page,
    pageSize,
    status,
  });

  const fullName = formatFullName({
    firstName: staff.firstName,
    middleName: staff.middleName,
    lastName: staff.lastName,
  });
  const displayName = [staff.title, fullName].filter(Boolean).join(' ').trim() || 'Unnamed staff';

  return (
    <div className="space-y-8">
      <PageHeader
        title={displayName}
        description={`In memoriam record • Died: ${formatDate(staff.dateOfDeath)}${staff.dateOfBirth ? ` • Born: ${formatDate(staff.dateOfBirth)}` : ''}`}
        actions={
          <Link href="/dashboard/tributes">
            <Button variant="outline">Back to Tributes</Button>
          </Link>
        }
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Departmental Tribute</h2>
          <p className="text-sm text-muted-foreground">
            Write and maintain the official departmental tribute statement.
          </p>
        </div>
        <DepartmentalTributeFormClient
          staffId={staff.id}
          initialTitle={staff.tribute?.title || ''}
          initialBodyHtml={staff.tribute?.bodyHtml || ''}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Testimonials Moderation</h2>
            <p className="text-sm text-muted-foreground">
              Review public testimonials submitted for this staff member.
            </p>
          </div>
          <form method="GET" action={`/dashboard/tributes/${staff.id}`} className="flex gap-2">
            <select
              name="status"
              defaultValue={status || ''}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DECLINED">Declined</option>
            </select>
            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          </form>
        </div>
        <TestimonialsModerationTable
          staffId={staff.id}
          items={items}
          total={total}
          page={page}
          pageSize={pageSize}
          status={status}
        />
      </section>
    </div>
  );
}
