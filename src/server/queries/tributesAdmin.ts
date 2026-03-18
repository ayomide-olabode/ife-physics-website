import prisma from '@/lib/prisma';
import { Prisma, StaffStatus } from '@prisma/client';

export async function listInMemoriamStaff({
  q = '',
  page = 1,
  pageSize = 10,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const where: Prisma.StaffWhereInput = {
    deletedAt: null,
    OR: [{ isInMemoriam: true }, { staffStatus: StaffStatus.IN_MEMORIAM }],
    ...(q
      ? {
          AND: [
            {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { middleName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { institutionalEmail: { contains: q, mode: 'insensitive' } },
              ],
            },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.staff.findMany({
      where,
      orderBy: [{ dateOfDeath: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        firstName: true,
        middleName: true,
        lastName: true,
        profileImageUrl: true,
        dateOfBirth: true,
        dateOfDeath: true,
        updatedAt: true,
      },
    }),
    prisma.staff.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
