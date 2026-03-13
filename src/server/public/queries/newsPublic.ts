import 'server-only';

import prisma from '@/lib/prisma';
import { wherePublished } from '../published';
import { paginationArgs, paginatedResult, type PaginationParams } from '../pagination';

/** Featured news for homepage hero carousel. */
export async function getFeaturedNews(limit = 4) {
  return prisma.news.findMany({
    where: {
      ...wherePublished(),
      isFeatured: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      date: true,
      imageUrl: true,
      buttonLabel: true,
      buttonLink: true,
      updatedAt: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

/** Paginated published news list (no body). */
export async function listPublicNews(params: PaginationParams = {}) {
  const { skip, take, page, pageSize } = paginationArgs(params);
  const where = wherePublished();

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
        date: true,
        imageUrl: true,
        updatedAt: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.news.count({ where }),
  ]);

  return paginatedResult(items, total, page, pageSize);
}

/** Full news detail by slug (includes body). */
export async function getPublicNewsBySlug(slug: string) {
  return prisma.news.findFirst({
    where: { slug, ...wherePublished() },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      imageUrl: true,
      date: true,
      buttonLabel: true,
      buttonLink: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}
