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

export type PublicRohEntry = {
  id: string;
  fullName: string;
  registrationNumber: string;
  programme: string;
  degree: string | null;
  cgpa: number;
  profileImageUrl: string | null;
  graduationYear: number;
};

export async function listPublicRohYears(): Promise<number[]> {
  const rows = await prisma.rollOfHonourEntry.findMany({
    where: whereNotDeleted(),
    select: { graduatingYear: true },
    distinct: ['graduatingYear'],
    orderBy: { graduatingYear: 'desc' },
  });

  return rows.map((row) => row.graduatingYear);
}

export async function listPublicRohByYear({
  year,
  take = 24,
  cursor,
}: {
  year: number;
  take?: number;
  cursor?: string | null;
}): Promise<{ entries: PublicRohEntry[]; nextCursor: string | null }> {
  const rows = await prisma.rollOfHonourEntry.findMany({
    where: {
      ...whereNotDeleted(),
      graduatingYear: year,
    },
    select: {
      id: true,
      name: true,
      registrationNumber: true,
      programme: true,
      cgpa: true,
      imageUrl: true,
      graduatingYear: true,
    },
    orderBy: [{ cgpa: 'desc' }, { name: 'asc' }],
    take: Math.max(1, Math.min(take, 60)) + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > Math.max(1, Math.min(take, 60));
  const pageRows = hasMore ? rows.slice(0, -1) : rows;
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null;

  return {
    entries: pageRows.map((row) => ({
      id: row.id,
      fullName: row.name,
      registrationNumber: row.registrationNumber,
      programme: row.programme,
      degree: null,
      cgpa: row.cgpa,
      profileImageUrl: row.imageUrl,
      graduationYear: row.graduatingYear,
    })),
    nextCursor,
  };
}
