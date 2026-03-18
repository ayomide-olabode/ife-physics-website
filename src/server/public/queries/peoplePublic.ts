import 'server-only';

import prisma from '@/lib/prisma';
import { StaffType, StaffStatus } from '@prisma/client';
import { paginationArgs, paginatedResult, type PaginationParams } from '../pagination';

// Map public route categories to StaffType + StaffStatus filters
const CATEGORY_MAP: Record<string, { staffType?: StaffType; staffStatus?: StaffStatus }> = {
  'academic-faculty': { staffType: 'ACADEMIC', staffStatus: 'ACTIVE' },
  'visiting-faculty': { staffType: 'VISITING', staffStatus: 'ACTIVE' },
  emeritus: { staffType: 'EMERITUS', staffStatus: 'ACTIVE' },
  'technical-staff': { staffType: 'TECHNICAL', staffStatus: 'ACTIVE' },
  'support-staff': { staffType: 'SUPPORT', staffStatus: 'ACTIVE' },
  'retired-faculty': { staffStatus: 'RETIRED' },
  'in-memoriam': { staffStatus: 'IN_MEMORIAM' },
};

/** Paginated staff list filtered by public category (e.g., "academic-faculty"). */
export async function listPublicStaffByCategory(category: string, params: PaginationParams = {}) {
  const filter = CATEGORY_MAP[category];
  if (!filter) return paginatedResult([], 0, 1, 10);

  const { skip, take, page, pageSize } = paginationArgs(params);

  const where = {
    deletedAt: null,
    ...filter,
  };

  const [items, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        institutionalEmail: true,
        academicRank: true,
        designation: true,
        researchArea: true,
        profileImageUrl: true,
        staffType: true,
        staffStatus: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take,
    }),
    prisma.staff.count({ where }),
  ]);

  return paginatedResult(items, total, page, pageSize);
}

/** Full staff profile by institutional email (used as slug). */
export async function getPublicStaffBySlug(slug: string) {
  return prisma.staff.findFirst({
    where: { institutionalEmail: slug, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      institutionalEmail: true,
      staffType: true,
      staffStatus: true,
      academicRank: true,
      designation: true,
      researchArea: true,
      researchInterests: true,
      roomNumber: true,
      academicLinkUrl: true,
      phoneNumber: true,
      bio: true,
      profileImageUrl: true,
      operationalUnit: true,
      areaOfExpertise: true,
      isInMemoriam: true,
      dateOfBirth: true,
      dateOfDeath: true,
      tribute: {
        select: {
          title: true,
          bodyHtml: true,
        },
      },
      testimonials: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          name: true,
          relationship: true,
          tributeHtml: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: 'desc' },
      },
      // Relations – limited for public view
      researchOutputs: {
        where: { deletedAt: null },
        select: {
          id: true,
          type: true,
          title: true,
          authors: true,
          year: true,
          venue: true,
          doi: true,
          url: true,
          sourceTitle: true,
        },
        orderBy: { year: 'desc' },
        take: 20,
      },
      projects: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          acronym: true,
          status: true,
          isFunded: true,
          startYear: true,
          endYear: true,
        },
        orderBy: { startYear: 'desc' },
        take: 20,
      },
      teaching: {
        where: { deletedAt: null },
        select: {
          id: true,
          courseCode: true,
          title: true,
          sessionYear: true,
          semester: true,
        },
        orderBy: { sessionYear: 'desc' },
        take: 20,
      },
      thesesSupervised: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          studentName: true,
          programme: true,
          degreeLevel: true,
          year: true,
          status: true,
        },
        orderBy: { year: 'desc' },
        take: 20,
      },
      hodAddress: {
        select: { title: true, body: true },
      },
    },
  });
}

/** Current HOD info for public display. */
export async function getPublicCurrentHod() {
  const term = await prisma.leadershipTerm.findFirst({
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
            select: { title: true, body: true },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  if (!term) return null;
  return { ...term.staff, startYear: term.startDate.getFullYear() };
}
