import 'server-only';

import type { EventOpportunityType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { wherePublished } from '../published';

type ListPublicEventOpportunitiesParams = {
  limit?: number;
  type?: EventOpportunityType;
};

/** List published events/opportunities, soonest first, optionally filtered by type. */
export async function listPublicEventOpportunities({
  limit = 10,
  type,
}: ListPublicEventOpportunitiesParams = {}) {
  const where = {
    ...wherePublished(),
    ...(type ? { type } : {}),
  };

  return prisma.eventOpportunity.findMany({
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
      deadline: true,
      linkUrl: true,
      updatedAt: true,
    },
    orderBy: [
      { deadline: { sort: 'asc', nulls: 'last' } },
      { startDate: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
    take: limit,
  });
}

/** Backward-compatible alias. */
export async function listPublicEventsOpportunities(
  limitOrParams: number | ListPublicEventOpportunitiesParams = 10,
) {
  if (typeof limitOrParams === 'number') {
    return listPublicEventOpportunities({ limit: limitOrParams });
  }
  return listPublicEventOpportunities(limitOrParams);
}
