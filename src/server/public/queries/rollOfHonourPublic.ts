import 'server-only';

import prisma from '@/lib/prisma';
import { whereNotDeleted } from '../published';
import { paginationArgs, paginatedResult, type PaginationParams } from '../pagination';

interface RollOfHonourParams extends PaginationParams {
  programme?: string;
}

/** Paginated roll of honour (no status field, soft-delete only). */
export async function listPublicRollOfHonour(params: RollOfHonourParams = {}) {
  const { skip, take, page, pageSize } = paginationArgs(params);

  const where = {
    ...whereNotDeleted(),
    ...(params.programme ? { programme: params.programme } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.rollOfHonourEntry.findMany({
      where,
      select: {
        id: true,
        name: true,
        programme: true,
        cgpa: true,
        graduatingYear: true,
        imageUrl: true,
      },
      orderBy: { graduatingYear: 'desc' },
      skip,
      take,
    }),
    prisma.rollOfHonourEntry.count({ where }),
  ]);

  return paginatedResult(items, total, page, pageSize);
}

/** Distinct programmes for filter dropdown. */
export async function listDistinctProgrammes() {
  const rows = await prisma.rollOfHonourEntry.findMany({
    where: whereNotDeleted(),
    distinct: ['programme'],
    select: { programme: true },
    orderBy: { programme: 'asc' },
  });
  return rows.map((r) => r.programme);
}
