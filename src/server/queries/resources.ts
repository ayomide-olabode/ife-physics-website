import prisma from '@/lib/prisma';
import { Prisma, PublishStatus } from '@prisma/client';

export async function listResources(params: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { q, status, page = 1, pageSize = 20 } = params;

  const where: Prisma.ResourceItemWhereInput = {
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (status && status !== 'ALL') {
    if (Object.values(PublishStatus).includes(status as PublishStatus)) {
      where.status = status as PublishStatus;
    }
  }

  const [data, total] = await Promise.all([
    prisma.resourceItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        linkUrl: true,
        fileUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.resourceItem.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getResourceById(id: string) {
  return prisma.resourceItem.findUnique({
    where: { id, deletedAt: null },
  });
}
