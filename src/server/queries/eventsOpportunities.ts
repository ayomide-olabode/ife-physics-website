import prisma from '@/lib/prisma';
import {
  Prisma,
  EventOpportunityType,
  EventCategory,
  OpportunityCategory,
  PublishStatus,
} from '.prisma/client';

function isMissingOptionalColumns(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as {
    code?: unknown;
    message?: unknown;
    meta?: { column?: unknown; modelName?: unknown };
  };

  if (err.code !== 'P2022') return false;

  const column = String(err.meta?.column ?? '').toLowerCase();
  const message = String(err.message ?? '').toLowerCase();

  return (
    column.includes('duration') ||
    column.includes('starttime') ||
    column.includes('start_time') ||
    column.includes('endtime') ||
    column.includes('end_time') ||
    message.includes('duration') ||
    message.includes('starttime') ||
    message.includes('start_time') ||
    message.includes('endtime') ||
    message.includes('end_time')
  );
}

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
  const buildWhere = (includeDurationSearch: boolean): Prisma.EventOpportunityWhereInput => {
    const where: Prisma.EventOpportunityWhereInput = { deletedAt: null };

    if (status) where.status = status;
    if (type) where.type = type;
    if (eventCategory) where.eventCategory = eventCategory;
    if (opportunityCategory) where.opportunityCategory = opportunityCategory;

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        ...(includeDurationSearch
          ? [{ duration: { contains: q, mode: Prisma.QueryMode.insensitive } }]
          : []),
        { venue: { contains: q, mode: 'insensitive' } },
      ];
    }

    return where;
  };

  let items: Array<{
    id: string;
    title: string;
    type: EventOpportunityType;
    eventCategory: EventCategory | null;
    opportunityCategory: OpportunityCategory | null;
    duration: string | null;
    startDate: Date | null;
    startTime: string | null;
    endDate: Date | null;
    endTime: string | null;
    venue: string | null;
    deadline: Date | null;
    status: PublishStatus;
    createdAt: Date;
  }>;
  let total: number;

  try {
    const where = buildWhere(true);
    [items, total] = await Promise.all([
      prisma.eventOpportunity.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          eventCategory: true,
          opportunityCategory: true,
          duration: true,
          startDate: true,
          startTime: true,
          endDate: true,
          endTime: true,
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
  } catch (error) {
    if (!isMissingOptionalColumns(error)) {
      throw error;
    }

    const where = buildWhere(false);
    const [fallbackItems, fallbackTotal] = await Promise.all([
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

    items = fallbackItems.map((item) => ({
      ...item,
      duration: null,
      startTime: null,
      endTime: null,
    }));
    total = fallbackTotal;
  }

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEventOpportunityById(id: string) {
  const where = { id, deletedAt: null };

  try {
    return await prisma.eventOpportunity.findFirst({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        eventCategory: true,
        opportunityCategory: true,
        description: true,
        duration: true,
        startDate: true,
        startTime: true,
        endDate: true,
        endTime: true,
        venue: true,
        linkUrl: true,
        deadline: true,
        status: true,
        publishedAt: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  } catch (error) {
    if (!isMissingOptionalColumns(error)) {
      throw error;
    }

    const row = await prisma.eventOpportunity.findFirst({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        eventCategory: true,
        opportunityCategory: true,
        description: true,
        startDate: true,
        endDate: true,
        venue: true,
        linkUrl: true,
        deadline: true,
        status: true,
        publishedAt: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return row
      ? {
          ...row,
          duration: null,
          startTime: null,
          endTime: null,
        }
      : null;
  }
}
