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
  hostSource: string | null;
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

function pickNonEmpty(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function resolveHostSource(output: {
  type: string;
  sourceTitle: string | null;
  venue: string | null;
  publisher: string | null;
  metaJson: unknown;
}): string | null {
  const meta = (output.metaJson && typeof output.metaJson === 'object' ? output.metaJson : {}) as Record<
    string,
    unknown
  >;

  switch (output.type) {
    case 'JOURNAL_ARTICLE':
      return pickNonEmpty(meta.journalName, output.sourceTitle, output.venue);
    case 'BOOK':
    case 'BOOK_CHAPTER':
    case 'MONOGRAPH':
      return pickNonEmpty(meta.publisher, output.publisher, output.sourceTitle);
    case 'DATA':
    case 'SOFTWARE':
      return pickNonEmpty(meta.publisher, output.publisher, output.sourceTitle);
    case 'PATENT':
      return pickNonEmpty(meta.issuer, output.publisher, output.sourceTitle, output.venue);
    case 'REPORT':
    case 'THESIS':
      return pickNonEmpty(meta.institution, output.publisher, output.sourceTitle, output.venue);
    case 'CONFERENCE_PAPER':
      return pickNonEmpty(meta.proceedingsTitle, output.sourceTitle, output.venue, meta.publisher);
    default:
      return pickNonEmpty(output.sourceTitle, output.venue, output.publisher);
  }
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
          publisher: true,
          doi: true,
          url: true,
          authors: true,
          authorsJson: true,
          metaJson: true,
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
        hostSource: resolveHostSource(output),
        doi: output.doi,
        url: output.url,
        authors: formattedAuthors || output.authors || 'Unknown author(s)',
      };
    })
    .filter((item) => item.id && item.groupSlug);
}
