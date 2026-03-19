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
          description: true,
        },
        orderBy: { createdAt: 'asc' },
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
              designation: true,
              institutionalEmail: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
  });
}

/** Recent research outputs authored by group members (reuses authorsJson staffId logic). */
export async function listPublicRecentOutputsForGroup(
  groupId: string,
  params?: { page?: number; pageSize?: number; q?: string },
) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, params?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const q = params?.q?.trim() ?? '';

  // Get member staff IDs
  const memberships = await prisma.researchGroupMembership.findMany({
    where: { researchGroupId: groupId, leftAt: null, staff: { deletedAt: null } },
    select: { staffId: true },
  });
  const staffIds = memberships.map((m) => m.staffId);
  if (staffIds.length === 0) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  const searchClause =
    q.length > 0
      ? Prisma.sql`
          AND (
            r.title ILIKE ${`%${q}%`}
            OR COALESCE(r.authors, '') ILIKE ${`%${q}%`}
            OR COALESCE(r."sourceTitle", '') ILIKE ${`%${q}%`}
            OR COALESCE(r.publisher, '') ILIKE ${`%${q}%`}
            OR COALESCE(r.venue, '') ILIKE ${`%${q}%`}
            OR COALESCE(r.year::text, '') ILIKE ${`%${q}%`}
          )
        `
      : Prisma.empty;

  const researchOutputs = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      year: number | null;
      fullDate: Date | null;
      outputType: string;
      authors: string;
      sourceTitle: string | null;
      venue: string | null;
      publisher: string | null;
      doi: string | null;
      url: string | null;
    }[]
  >`
    SELECT
      deduped.id,
      deduped.title,
      deduped.year,
      deduped."fullDate",
      deduped."outputType",
      deduped.authors,
      deduped."sourceTitle",
      deduped.venue,
      deduped.publisher,
      deduped.doi,
      deduped.url
    FROM (
      SELECT DISTINCT ON (r.id)
        r.id,
        r.title,
        r.year,
        r."fullDate",
        r.type as "outputType",
        COALESCE(NULLIF(BTRIM(r.authors), ''), 'Unknown author(s)') as authors,
        r."sourceTitle",
        r.venue,
        r.publisher,
        r.doi,
        r.url,
        r."updatedAt"
      FROM "ResearchOutput" r,
           jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
      WHERE r."deletedAt" IS NULL
        AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
        ${searchClause}
      ORDER BY r.id, r."fullDate" DESC NULLS LAST, r.year DESC NULLS LAST, r."updatedAt" DESC
    ) as deduped
    ORDER BY deduped."fullDate" DESC NULLS LAST, deduped.year DESC NULLS LAST, deduped."updatedAt" DESC
    LIMIT ${pageSize}
    OFFSET ${offset};
  `;

  const countRows = await prisma.$queryRaw<{ total: number }[]>`
    SELECT COUNT(*)::int as total
    FROM (
      SELECT DISTINCT r.id
      FROM "ResearchOutput" r,
           jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
      WHERE r."deletedAt" IS NULL
        AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
        ${searchClause}
    ) as deduped;
  `;
  const total = countRows[0]?.total ?? 0;

  return {
    items: researchOutputs,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
