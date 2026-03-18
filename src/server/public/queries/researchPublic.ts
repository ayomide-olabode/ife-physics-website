import 'server-only';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { whereNotDeleted } from '../published';
export { getFeaturedResearchOutputs } from './featuredResearchOutputs';

const listPublicResearchGroupsCached = unstable_cache(
  async () =>
    prisma.researchGroup.findMany({
      where: whereNotDeleted(),
      select: {
        name: true,
        abbreviation: true,
        slug: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' },
    }),
  ['public-research-groups'],
  { tags: ['public:research-groups'] },
);

/** List all research groups (public cards). */
export async function listPublicResearchGroups() {
  return listPublicResearchGroupsCached();
}

/** Full research group detail by slug (public). */
export async function getPublicResearchGroupBySlug(slug: string) {
  return prisma.researchGroup.findFirst({
    where: { slug, ...whereNotDeleted() },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      slug: true,
      imageUrl: true,
      overview: true,
      focusAreas: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          orderIndex: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
      featuredResearchOutputId: true,
      memberships: {
        where: { leftAt: null, staff: { deletedAt: null } },
        select: {
          staff: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              academicRank: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
  });
}

/** Recent research outputs authored by group members (reuses authorsJson staffId logic). */
export async function listPublicRecentOutputsForGroup(groupId: string, take = 20) {
  // Get member staff IDs
  const memberships = await prisma.researchGroupMembership.findMany({
    where: { researchGroupId: groupId, leftAt: null, staff: { deletedAt: null } },
    select: { staffId: true },
  });
  const staffIds = memberships.map((m) => m.staffId);
  if (staffIds.length === 0) return [];

  const researchOutputs = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      year: number | null;
      sourceTitle: string | null;
      doi: string | null;
      url: string | null;
      type: string;
    }[]
  >`
    SELECT DISTINCT r.id, r.title, r.year, r."sourceTitle", r.doi, r.url, r.type
    FROM "ResearchOutput" r,
         jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
    WHERE r."deletedAt" IS NULL
      AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
    ORDER BY r.year DESC NULLS LAST
    LIMIT ${take};
  `;

  return researchOutputs;
}
