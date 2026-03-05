import prisma from '@/lib/prisma';
import {
  EventOpportunityType,
  EventCategory,
  OpportunityCategory,
  PublishStatus,
} from '.prisma/client';

export async function listEventsOpportunities({
  page = 1,
  pageSize = 20,
  status,
  type,
  eventCategory,
  opportunityCategory,
  q,
}: {
  page?: number;
  pageSize?: number;
  status?: PublishStatus;
  type?: EventOpportunityType;
  eventCategory?: EventCategory;
  opportunityCategory?: OpportunityCategory;
  q?: string;
} = {}) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (status) where.status = status;
  if (type) where.type = type;
  if (eventCategory) where.eventCategory = eventCategory;
  if (opportunityCategory) where.opportunityCategory = opportunityCategory;

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { venue: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.eventOpportunity.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        eventCategory: true,
        opportunityCategory: true,
        startDate: true,
        endDate: true,
        venue: true,
        deadline: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
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
