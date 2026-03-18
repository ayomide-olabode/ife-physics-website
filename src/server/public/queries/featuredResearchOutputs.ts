import 'server-only';

import prisma from '@/lib/prisma';
import { whereNotDeleted } from '../published';

/**
 * Fetch featured research outputs for homepage.
 * Looks at each research group's featuredResearchOutputId,
 * fetches the corresponding ResearchOutput, and returns up to `limit` results.
 */
export async function getFeaturedResearchOutputs(limit = 3) {
  // Get groups that have a featured research output set
  const groups = await prisma.researchGroup.findMany({
    where: {
      ...whereNotDeleted(),
      featuredResearchOutputId: { not: null },
    },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      slug: true,
      featuredResearchOutputId: true,
    },
    orderBy: { name: 'asc' },
  });

  if (groups.length === 0) return [];

  const outputIds = groups
    .map((g) => g.featuredResearchOutputId)
    .filter((id): id is string => id !== null);

  const outputs = await prisma.researchOutput.findMany({
    where: { id: { in: outputIds }, deletedAt: null },
    select: {
      id: true,
      type: true,
      title: true,
      authors: true,
      year: true,
      fullDate: true,
      sourceTitle: true,
      doi: true,
      url: true,
    },
    orderBy: { year: 'desc' },
    take: limit,
  });

  // Attach group name to each output
  return outputs.map((o) => {
    const group = groups.find((g) => g.featuredResearchOutputId === o.id);
    return {
      ...o,
      groupName: group?.name ?? '',
      groupAbbreviation: group?.abbreviation ?? '',
      groupSlug: group?.slug ?? '',
    };
  });
}
