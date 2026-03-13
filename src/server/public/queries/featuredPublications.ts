import 'server-only';

import prisma from '@/lib/prisma';
import { whereNotDeleted } from '../published';

/**
 * Fetch featured publications for homepage.
 * Looks at each research group's featuredPublicationId,
 * fetches the corresponding ResearchOutput, and returns up to `limit` results.
 */
export async function getFeaturedPublications(limit = 3) {
  // Get groups that have a featured publication set
  const groups = await prisma.researchGroup.findMany({
    where: {
      ...whereNotDeleted(),
      featuredPublicationId: { not: null },
    },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      featuredPublicationId: true,
    },
    orderBy: { name: 'asc' },
  });

  if (groups.length === 0) return [];

  const pubIds = groups
    .map((g) => g.featuredPublicationId)
    .filter((id): id is string => id !== null);

  const outputs = await prisma.researchOutput.findMany({
    where: { id: { in: pubIds }, deletedAt: null },
    select: {
      id: true,
      type: true,
      title: true,
      authors: true,
      year: true,
      sourceTitle: true,
      doi: true,
      url: true,
    },
    orderBy: { year: 'desc' },
    take: limit,
  });

  // Attach group name to each output
  return outputs.map((o) => {
    const group = groups.find((g) => g.featuredPublicationId === o.id);
    return { ...o, groupName: group?.name ?? '', groupAbbreviation: group?.abbreviation ?? '' };
  });
}
