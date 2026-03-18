import 'server-only';

import prisma from '@/lib/prisma';

/** Active academic coordinators (endDate is null). */
export async function listPublicAcademicCoordinators() {
  const now = new Date();
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      role: 'ACADEMIC_COORDINATOR',
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: {
      id: true,
      programmeScope: true,
      degreeScope: true,
      user: {
        select: {
          staff: {
            select: {
              id: true,
              title: true,
              firstName: true,
              middleName: true,
              lastName: true,
              profileImageUrl: true,
              institutionalEmail: true,
              designation: true,
            },
          },
        },
      },
    },
  });

  const programmeRank = { GENERAL: 0, PHY: 1, EPH: 2, SLT: 3 } as const;
  const degreeRank = { GENERAL: 0, UNDERGRADUATE: 1, POSTGRADUATE: 2 } as const;

  const cards = assignments
    .filter(
      (assignment) => assignment.programmeScope && assignment.degreeScope && assignment.user.staff,
    )
    .map((assignment) => ({
      id: assignment.id,
      staff: {
        id: assignment.user.staff.id,
        title: assignment.user.staff.title,
        firstName: assignment.user.staff.firstName,
        middleName: assignment.user.staff.middleName,
        lastName: assignment.user.staff.lastName,
        institutionalEmail: assignment.user.staff.institutionalEmail,
        designation: assignment.user.staff.designation,
        profileImageUrl: assignment.user.staff.profileImageUrl,
      },
      programmeScope: assignment.programmeScope!,
      degreeScope: assignment.degreeScope!,
    }))
    .sort((a, b) => {
      const programmeCmp = programmeRank[a.programmeScope] - programmeRank[b.programmeScope];
      if (programmeCmp !== 0) return programmeCmp;
      const degreeCmp = degreeRank[a.degreeScope] - degreeRank[b.degreeScope];
      if (degreeCmp !== 0) return degreeCmp;
      const aName = `${a.staff.lastName ?? ''} ${a.staff.firstName ?? ''}`.toLowerCase();
      const bName = `${b.staff.lastName ?? ''} ${b.staff.firstName ?? ''}`.toLowerCase();
      return aName.localeCompare(bName);
    });

  return cards;
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
          middleName: true,
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

/** Leadership payload for /about/leadership public page. */
export async function getPublicLeadership() {
  const [currentHodTerm, academicCoordinators, pastHodTerms] = await Promise.all([
    prisma.leadershipTerm.findFirst({
      where: { role: 'HOD', endDate: null },
      select: {
        startDate: true,
        staff: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            academicRank: true,
            profileImageUrl: true,
            hodAddress: {
              select: {
                title: true,
                body: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    listPublicAcademicCoordinators(),
    prisma.leadershipTerm.findMany({
      where: { role: 'HOD', endDate: { not: null } },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        staff: {
          select: {
            id: true,
            title: true,
            firstName: true,
            middleName: true,
            lastName: true,
            profileImageUrl: true,
            designation: true,
            academicRank: true,
            hodAddress: {
              select: {
                title: true,
                body: true,
              },
            },
          },
        },
      },
      orderBy: { endDate: 'desc' },
    }),
  ]);

  const currentHod = currentHodTerm
    ? { ...currentHodTerm.staff, startYear: currentHodTerm.startDate.getFullYear() }
    : null;

  const pastHods = pastHodTerms.map((term) => ({
    id: term.id,
    startYear: term.startDate.getFullYear(),
    endYear: term.endDate ? term.endDate.getFullYear() : null,
    staff: {
      id: term.staff.id,
      title: term.staff.title,
      firstName: term.staff.firstName,
      middleName: term.staff.middleName,
      lastName: term.staff.lastName,
      profileImageUrl: term.staff.profileImageUrl,
      designation: term.staff.designation,
      academicRank: term.staff.academicRank,
    },
    address: term.staff.hodAddress
      ? { title: term.staff.hodAddress.title, body: term.staff.hodAddress.body }
      : null,
  }));

  return {
    currentHod,
    academicCoordinators,
    pastHods,
  };
}
