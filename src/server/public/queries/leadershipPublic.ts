import 'server-only';

import prisma from '@/lib/prisma';

/** Active academic coordinators (endDate is null). */
export async function listPublicAcademicCoordinators() {
  const now = new Date();
  const terms = await prisma.leadershipTerm.findMany({
    where: { role: 'ACADEMIC_COORDINATOR', endDate: null },
    select: {
      id: true,
      startDate: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          profileImageUrl: true,
          user: {
            select: {
              roleAssignments: {
                where: {
                  role: 'ACADEMIC_COORDINATOR',
                  deletedAt: null,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
                select: {
                  id: true,
                  programmeScope: true,
                  degreeScope: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  const seen = new Set<string>();
  const cards = terms.flatMap((term) =>
    (term.staff.user?.roleAssignments ?? [])
      .filter((assignment) => assignment.programmeScope && assignment.degreeScope)
      .map((assignment) => ({
        id: assignment.id,
        staffId: term.staff.id,
        firstName: term.staff.firstName,
        middleName: term.staff.middleName,
        lastName: term.staff.lastName,
        profileImageUrl: term.staff.profileImageUrl,
        programmeScope: assignment.programmeScope,
        degreeScope: assignment.degreeScope,
      }))
      .filter((card) => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      }),
  );

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
  const now = new Date();
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
    prisma.leadershipTerm.findMany({
      where: { role: 'ACADEMIC_COORDINATOR', endDate: null },
      select: {
        id: true,
        startDate: true,
        staff: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            profileImageUrl: true,
            user: {
              select: {
                roleAssignments: {
                  where: {
                    role: 'ACADEMIC_COORDINATOR',
                    deletedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                  },
                  select: {
                    id: true,
                    programmeScope: true,
                    degreeScope: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
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

  const seenCoordinatorAssignmentIds = new Set<string>();
  const coordinatorCards = academicCoordinators.flatMap((term) =>
    (term.staff.user?.roleAssignments ?? [])
      .filter((assignment) => assignment.programmeScope && assignment.degreeScope)
      .map((assignment) => ({
        id: assignment.id,
        staff: {
          id: term.staff.id,
          firstName: term.staff.firstName,
          middleName: term.staff.middleName,
          lastName: term.staff.lastName,
          profileImageUrl: term.staff.profileImageUrl,
        },
        programmeScope: assignment.programmeScope,
        degreeScope: assignment.degreeScope,
      }))
      .filter((card) => {
        if (seenCoordinatorAssignmentIds.has(card.id)) return false;
        seenCoordinatorAssignmentIds.add(card.id);
        return true;
      }),
  );

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
    academicCoordinators: coordinatorCards,
    pastHods,
  };
}
