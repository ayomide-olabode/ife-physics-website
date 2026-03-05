import prisma from '@/lib/prisma';
import { PublishStatus, Prisma } from '.prisma/client';

export async function listEventsOpportunities({
  page = 1,
  pageSize = 20,
  status,
  kind,
  q,
  upcomingOnly,
}: {
  page?: number;
  pageSize?: number;
  status?: PublishStatus;
  kind?: string;
  q?: string;
  upcomingOnly?: boolean;
} = {}) {
  const where: Prisma.EventOpportunityWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(kind ? { type: kind } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { venue: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(upcomingOnly
      ? {
          OR: [{ startDate: { gte: new Date() } }, { deadline: { gte: new Date() } }],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.eventOpportunity.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        startDate: true,
        endDate: true,
        venue: true,
        deadline: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ deadline: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.eventOpportunity.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEventOpportunityById(id: string) {
  return prisma.eventOpportunity.findFirst({
    where: { id, deletedAt: null },
  });
}
