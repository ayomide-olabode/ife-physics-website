import 'server-only';

import prisma from '@/lib/prisma';
import { wherePublished } from '../published';

/** List published events and opportunities, most recent first. */
export async function listPublicEventsOpportunities(limit = 10) {
  return prisma.eventOpportunity.findMany({
    where: wherePublished(),
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
    orderBy: { startDate: 'desc' },
    take: limit,
  });
}
