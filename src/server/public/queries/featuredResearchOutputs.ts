import 'server-only';

import type { AuthorObject } from '@/lib/researchOutputTypes';
import prisma from '@/lib/prisma';
import { formatAuthorsForDisplay } from '@/lib/legacyResearchOutputCompat';
import { whereNotDeleted } from '../published';

export type FeaturedResearchOutputItem = {
  id: string;
  groupName: string;
  groupSlug: string;
  outputType: string;
  title: string;
  year: number | null;
  sourceTitle: string | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  authors: string;
};

function parseAuthorsJson(value: unknown): AuthorObject[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is AuthorObject => {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      (typeof (entry as { given_name?: unknown }).given_name === 'string' ||
        typeof (entry as { family_name?: unknown }).family_name === 'string')
    );
  });
}

/**
 * Fetch one featured research output per research group for homepage cards.
 * Only groups with a non-null featuredResearchOutputId are returned.
 */
export async function getFeaturedResearchOutputs(): Promise<FeaturedResearchOutputItem[]> {
  const groups = await prisma.researchGroup.findMany({
    where: {
      ...whereNotDeleted(),
      featuredResearchOutputId: { not: null },
      featuredResearchOutput: {
        is: {
          deletedAt: null,
        },
      },
    },
    select: {
      name: true,
      slug: true,
      featuredResearchOutput: {
        select: {
          id: true,
          type: true,
          title: true,
          year: true,
          sourceTitle: true,
          venue: true,
          doi: true,
          url: true,
          authors: true,
          authorsJson: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return groups
    .filter((group) => group.featuredResearchOutput)
    .map((group) => {
      const output = group.featuredResearchOutput!;
      const authorsJson = parseAuthorsJson(output.authorsJson);
      const formattedAuthors = formatAuthorsForDisplay(authorsJson);

      return {
        id: output.id,
        groupName: group.name,
        groupSlug: group.slug,
        outputType: output.type,
        title: output.title,
        year: output.year,
        sourceTitle: output.sourceTitle,
        venue: output.venue,
        doi: output.doi,
        url: output.url,
        authors: formattedAuthors || output.authors || 'Unknown author(s)',
      };
    })
    .filter((item) => item.id && item.groupSlug);
}
