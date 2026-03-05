import prisma from '@/lib/prisma';

export type ThesisRow = {
  id: string;
  year: number;
  title: string;
  studentName: string | null;
  status: string;
  createdAt: Date;
};

export async function listMyTheses({
  staffId,
  page = 1,
  pageSize = 20,
}: {
  staffId: string;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const [items, totalCount] = await Promise.all([
    prisma.studentThesis.findMany({
      where: {
        staffId,
        deletedAt: null,
      },
      select: {
        id: true,
        year: true,
        title: true,
        studentName: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.studentThesis.count({
      where: {
        staffId,
        deletedAt: null,
      },
    }),
  ]);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getMyThesisById({ staffId, id }: { staffId: string; id: string }) {
  return prisma.studentThesis.findFirst({
    where: {
      id,
      staffId,
      deletedAt: null,
    },
    select: {
      id: true,
      year: true,
      title: true,
      studentName: true,
      programme: true,
      degreeLevel: true,
      status: true,
    },
  });
}
