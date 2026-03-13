import 'server-only';

import prisma from '@/lib/prisma';

/** Active academic coordinators (endDate is null). */
export async function listPublicAcademicCoordinators() {
  const terms = await prisma.leadershipTerm.findMany({
    where: { role: 'ACADEMIC_COORDINATOR', endDate: null },
    select: {
      id: true,
      programmeCode: true,
      startDate: true,
      staff: {
        select: {
          firstName: true,
          lastName: true,
          designation: true,
          profileImageUrl: true,
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  return terms;
}

/** Past HOD terms (endDate is NOT null). */
export async function listPublicPastHods() {
  const terms = await prisma.leadershipTerm.findMany({
    where: { role: 'HOD', endDate: { not: null } },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      staff: {
        select: {
          firstName: true,
          lastName: true,
          profileImageUrl: true,
          hodAddress: {
            select: { title: true, body: true },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  return terms;
}
