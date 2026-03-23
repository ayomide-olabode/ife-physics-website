import 'server-only';

import prisma from '@/lib/prisma';
import { getAcademicRankSortValue } from '@/lib/rankOrder';
import { buildStaffSlug, slugify } from '@/lib/slug';
import { unstable_cache } from 'next/cache';
import { Prisma, StaffStatus, StaffType } from '@prisma/client';

const PUBLIC_VISIBLE_STAFF_STATUSES: StaffStatus[] = ['ACTIVE', 'RETIRED', 'IN_MEMORIAM'];
const FORMER_STATUS: StaffStatus = 'FORMER';

// Map public route categories to StaffType + StaffStatus filters
const CATEGORY_MAP: Record<string, { staffType?: StaffType; staffStatus?: StaffStatus }> = {
  'academic-faculty': { staffType: 'ACADEMIC', staffStatus: 'ACTIVE' },
  'visiting-faculty': { staffType: 'VISITING', staffStatus: 'ACTIVE' },
  'emeritus-faculty': { staffType: 'EMERITUS', staffStatus: 'ACTIVE' },
  'technical-staff': { staffType: 'TECHNICAL', staffStatus: 'ACTIVE' },
  'support-staff': { staffType: 'SUPPORT', staffStatus: 'ACTIVE' },
  'retired-staff': { staffStatus: 'RETIRED' },
  'in-memoriam': { staffStatus: 'IN_MEMORIAM' },
};

export type PublicPeopleCategory = keyof typeof CATEGORY_MAP;
export type PublicPeopleSort = 'default' | 'name-asc' | 'name-desc';
export type PublicPeopleFilters = {
  rank?: string;
  researchGroupSlug?: string;
  secondaryAffiliationId?: string;
  formerStaffType?: StaffType;
  alpha?: string;
};

type StaffSlugIdentity = {
  id: string;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  institutionalEmail: string;
};

function wherePublicVisibleStaff(): Prisma.StaffWhereInput {
  return {
    deletedAt: null,
    isPublicProfile: true,
    staffStatus: { not: FORMER_STATUS },
    OR: [{ staffStatus: { in: PUBLIC_VISIBLE_STAFF_STATUSES } }, { isInMemoriam: true }],
  };
}

const getCachedPublicStaffSlugIndex = unstable_cache(
  async () => {
    const slugRows = await prisma.staff.findMany({
      where: wherePublicVisibleStaff(),
      select: {
        id: true,
        title: true,
        firstName: true,
        middleName: true,
        lastName: true,
        institutionalEmail: true,
      },
    });

    const slugById = buildUniqueStaffSlugs(slugRows);
    const idBySlug: Record<string, string> = {};
    const computedSlugById: Record<string, string> = {};

    for (const [staffId, computedSlug] of slugById.entries()) {
      computedSlugById[staffId] = computedSlug;
      idBySlug[computedSlug] = staffId;
    }

    return { idBySlug, computedSlugById };
  },
  ['public-staff-slug-index'],
  {
    revalidate: 60,
    tags: ['public:staff-slug-index'],
  },
);

async function resolvePublicStaffSlug(slug: string): Promise<{ staffId: string; computedSlug: string } | null> {
  const normalizedSlug = slugify(slug);
  if (!normalizedSlug) return null;

  const index = await getCachedPublicStaffSlugIndex();
  const staffId = index.idBySlug[normalizedSlug];
  if (!staffId) return null;

  return { staffId, computedSlug: normalizedSlug };
}

function buildUniqueStaffSlugs(staff: StaffSlugIdentity[]): Map<string, string> {
  const grouped = new Map<string, StaffSlugIdentity[]>();

  for (const row of staff) {
    const fromName = buildStaffSlug({
      title: row.title,
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
    });
    const emailLocalPart = row.institutionalEmail.split('@')[0] ?? '';
    const baseSlug = fromName || slugify(emailLocalPart) || 'staff';

    const existing = grouped.get(baseSlug);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(baseSlug, [row]);
    }
  }

  const slugByStaffId = new Map<string, string>();
  for (const [baseSlug, entries] of grouped.entries()) {
    const ordered = [...entries].sort((a, b) => a.id.localeCompare(b.id));
    ordered.forEach((row, index) => {
      const suffix = index === 0 ? '' : `-${index + 1}`;
      slugByStaffId.set(row.id, `${baseSlug}${suffix}`);
    });
  }

  return slugByStaffId;
}

function compareNullableStrings(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
}

function inferLinks(url: string | null): {
  googleScholarUrl: string | null;
  orcidUrl: string | null;
} {
  if (!url) {
    return { googleScholarUrl: null, orcidUrl: null };
  }

  const lower = url.toLowerCase();
  return {
    googleScholarUrl: lower.includes('scholar.google') ? url : null,
    orcidUrl: lower.includes('orcid.org') ? url : null,
  };
}

export interface PublicAcademicFacultyParams {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: PublicPeopleSort;
  filters?: PublicPeopleFilters;
}

export interface PublicPeopleCardItem {
  staffId: string;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  academicRank: string | null;
  designation: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
  primaryResearchGroup: { name: string; slug: string } | null;
  secondaryAffiliation: { name: string; acronym: string | null } | null;
  computedStaffSlug: string;
  staffStatus: StaffStatus;
  isInMemoriam: boolean;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  isHod: boolean;
  rankSortValue: number;
}

export type PublicAcademicFacultyItem = PublicPeopleCardItem;

function buildCardItem(
  row: {
    id: string;
    title: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    academicRank: string | null;
    designation: string | null;
    institutionalEmail: string;
    profileImageUrl: string | null;
    staffStatus: StaffStatus;
    isInMemoriam: boolean;
    dateOfBirth: Date | null;
    dateOfDeath: Date | null;
    secondaryAffiliation: {
      name: string;
      acronym: string | null;
    } | null;
    researchMemberships: Array<{
      researchGroup: {
        name: string;
        slug: string;
      };
    }>;
  },
  computedSlugById: Map<string, string>,
  currentHodStaffId: string | null,
): PublicPeopleCardItem {
  const rankSortValue = getAcademicRankSortValue(row.academicRank);
  return {
    staffId: row.id,
    title: row.title,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    academicRank: row.academicRank,
    designation: row.designation,
    institutionalEmail: row.institutionalEmail,
    profileImageUrl: row.profileImageUrl,
    primaryResearchGroup: row.researchMemberships[0]
      ? {
          name: row.researchMemberships[0].researchGroup.name,
          slug: row.researchMemberships[0].researchGroup.slug,
        }
      : null,
    secondaryAffiliation: row.secondaryAffiliation
      ? {
          name: row.secondaryAffiliation.name,
          acronym: row.secondaryAffiliation.acronym,
        }
      : null,
    computedStaffSlug: computedSlugById.get(row.id) ?? 'staff',
    staffStatus: row.staffStatus,
    isInMemoriam: row.isInMemoriam,
    dateOfBirth: row.dateOfBirth,
    dateOfDeath: row.dateOfDeath,
    isHod: currentHodStaffId === row.id,
    rankSortValue,
  };
}

function sortAcademicFaculty(a: PublicPeopleCardItem, b: PublicPeopleCardItem): number {
  if (a.isHod !== b.isHod) return a.isHod ? -1 : 1;
  if (a.rankSortValue !== b.rankSortValue) return a.rankSortValue - b.rankSortValue;

  const lastNameCmp = compareNullableStrings(a.lastName, b.lastName);
  if (lastNameCmp !== 0) return lastNameCmp;

  const firstNameCmp = compareNullableStrings(a.firstName, b.firstName);
  if (firstNameCmp !== 0) return firstNameCmp;

  return a.staffId.localeCompare(b.staffId);
}

function sortByName(a: PublicPeopleCardItem, b: PublicPeopleCardItem): number {
  const lastNameCmp = compareNullableStrings(a.lastName, b.lastName);
  if (lastNameCmp !== 0) return lastNameCmp;

  const firstNameCmp = compareNullableStrings(a.firstName, b.firstName);
  if (firstNameCmp !== 0) return firstNameCmp;

  return a.staffId.localeCompare(b.staffId);
}

export async function listPublicAcademicFaculty({
  q,
  page = 1,
  pageSize = 9,
  sort = 'default',
  filters = {},
}: PublicAcademicFacultyParams = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 9;

  const query = q?.trim();
  const andFilters: Prisma.StaffWhereInput[] = [];

  if (query) {
    andFilters.push({
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { middleName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { institutionalEmail: { contains: query, mode: 'insensitive' } },
      ],
    });
  }
  if (filters.rank) {
    andFilters.push({ academicRank: filters.rank });
  }
  if (filters.researchGroupSlug) {
    andFilters.push({
      researchMemberships: {
        some: {
          leftAt: null,
          researchGroup: { deletedAt: null, slug: filters.researchGroupSlug },
        },
      },
    });
  }
  if (filters.secondaryAffiliationId) {
    andFilters.push({ secondaryAffiliationId: filters.secondaryAffiliationId });
  }
  if (filters.formerStaffType) {
    andFilters.push({ staffType: filters.formerStaffType });
  }
  if (filters.alpha) {
    andFilters.push({
      OR: [
        { lastName: { startsWith: filters.alpha, mode: 'insensitive' } },
        { firstName: { startsWith: filters.alpha, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.StaffWhereInput = {
    deletedAt: null,
    isPublicProfile: true,
    staffType: 'ACADEMIC',
    staffStatus: 'ACTIVE',
    isInMemoriam: false,
    AND: andFilters,
  };

  const [rows, activeHodTerm] = await Promise.all([
    prisma.staff.findMany({
      where,
      select: {
        id: true,
        title: true,
        firstName: true,
        middleName: true,
        lastName: true,
        academicRank: true,
        designation: true,
        institutionalEmail: true,
        profileImageUrl: true,
        staffStatus: true,
        isInMemoriam: true,
        dateOfBirth: true,
        dateOfDeath: true,
        secondaryAffiliation: {
          select: {
            name: true,
            acronym: true,
          },
        },
        researchMemberships: {
          where: {
            leftAt: null,
            researchGroup: {
              deletedAt: null,
            },
          },
          orderBy: [{ joinedAt: 'asc' }, { researchGroup: { name: 'asc' } }],
          take: 1,
          select: {
            researchGroup: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.leadershipTerm.findFirst({
      where: {
        role: 'HOD',
        endDate: null,
      },
      orderBy: { startDate: 'desc' },
      select: {
        staffId: true,
      },
    }),
  ]);

  const computedSlugById = buildUniqueStaffSlugs(rows);
  const currentHodStaffId = activeHodTerm?.staffId ?? null;

  const mapped = rows.map<PublicAcademicFacultyItem>((row) =>
    buildCardItem(row, computedSlugById, currentHodStaffId),
  );

  const sorted =
    sort === 'name-asc'
      ? mapped.sort(sortByName)
      : sort === 'name-desc'
        ? mapped.sort((a, b) => sortByName(b, a))
        : mapped.sort(sortAcademicFaculty);

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = sorted.slice(start, end);

  return {
    items,
    nextPage: end < sorted.length ? safePage + 1 : undefined,
  };
}

export async function listPublicPeopleByCategory(
  category: PublicPeopleCategory,
  { q, page = 1, pageSize = 9, sort = 'default', filters = {} }: PublicAcademicFacultyParams = {},
) {
  if (category === 'academic-faculty') {
    return listPublicAcademicFaculty({ q, page, pageSize, sort, filters });
  }

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 9;
  const query = q?.trim();
  const filter = CATEGORY_MAP[category];
  const isInMemoriamCategory = category === 'in-memoriam';
  const baseCategoryFilter = isInMemoriamCategory
    ? { OR: [{ staffStatus: 'IN_MEMORIAM' as const }, { isInMemoriam: true }] }
    : { ...filter };

  const andFilters: Prisma.StaffWhereInput[] = [baseCategoryFilter];
  if (query) {
    andFilters.push({
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { middleName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { institutionalEmail: { contains: query, mode: 'insensitive' } },
      ],
    });
  }
  if (filters.rank) {
    andFilters.push({ academicRank: filters.rank });
  }
  if (filters.researchGroupSlug) {
    andFilters.push({
      researchMemberships: {
        some: {
          leftAt: null,
          researchGroup: { deletedAt: null, slug: filters.researchGroupSlug },
        },
      },
    });
  }
  if (filters.secondaryAffiliationId) {
    andFilters.push({ secondaryAffiliationId: filters.secondaryAffiliationId });
  }
  if (filters.formerStaffType) {
    andFilters.push({ staffType: filters.formerStaffType });
  }
  if (filters.alpha) {
    andFilters.push({
      OR: [
        { lastName: { startsWith: filters.alpha, mode: 'insensitive' } },
        { firstName: { startsWith: filters.alpha, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.StaffWhereInput = {
    deletedAt: null,
    isPublicProfile: true,
    staffStatus: { not: FORMER_STATUS },
    AND: andFilters,
  };

  const rows = await prisma.staff.findMany({
    where,
    select: {
      id: true,
      title: true,
      firstName: true,
      middleName: true,
      lastName: true,
      academicRank: true,
      designation: true,
      institutionalEmail: true,
      profileImageUrl: true,
      staffStatus: true,
      isInMemoriam: true,
      dateOfBirth: true,
      dateOfDeath: true,
      secondaryAffiliation: {
        select: {
          name: true,
          acronym: true,
        },
      },
      researchMemberships: {
        where: {
          leftAt: null,
          researchGroup: {
            deletedAt: null,
          },
        },
        orderBy: [{ joinedAt: 'asc' }, { researchGroup: { name: 'asc' } }],
        take: 1,
        select: {
          researchGroup: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  const computedSlugById = buildUniqueStaffSlugs(rows);
  const mapped = rows.map<PublicPeopleCardItem>((row) =>
    buildCardItem(row, computedSlugById, null),
  );
  const sorted =
    sort === 'name-desc' ? mapped.sort((a, b) => sortByName(b, a)) : mapped.sort(sortByName);

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = sorted.slice(start, end);

  return {
    items,
    nextPage: end < sorted.length ? safePage + 1 : undefined,
  };
}

export async function getPublicPeopleFilterFacets(category: PublicPeopleCategory) {
  const filter = CATEGORY_MAP[category];
  const isInMemoriamCategory = category === 'in-memoriam';
  const baseCategoryFilter = isInMemoriamCategory
    ? { OR: [{ staffStatus: 'IN_MEMORIAM' as const }, { isInMemoriam: true }] }
    : { ...filter };

  const rows = await prisma.staff.findMany({
    where: {
      deletedAt: null,
      isPublicProfile: true,
      staffStatus: { not: FORMER_STATUS },
      AND: [baseCategoryFilter],
    },
    select: {
      academicRank: true,
      staffType: true,
      secondaryAffiliation: { select: { id: true, name: true } },
      researchMemberships: {
        where: {
          leftAt: null,
          researchGroup: { deletedAt: null },
        },
        select: {
          researchGroup: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const ranks = Array.from(
    new Set(rows.map((r) => r.academicRank?.trim()).filter((v): v is string => Boolean(v))),
  ).sort((a, b) => a.localeCompare(b));

  const groupsMap = new Map<string, string>();
  for (const row of rows) {
    for (const membership of row.researchMemberships) {
      groupsMap.set(membership.researchGroup.slug, membership.researchGroup.name);
    }
  }
  const researchGroups = Array.from(groupsMap.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const affiliationsMap = new Map<string, string>();
  for (const row of rows) {
    if (row.secondaryAffiliation?.id && row.secondaryAffiliation?.name) {
      affiliationsMap.set(row.secondaryAffiliation.id, row.secondaryAffiliation.name);
    }
  }
  const affiliations = Array.from(affiliationsMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const formerStaffTypes = Array.from(new Set(rows.map((r) => r.staffType))).sort((a, b) =>
    a.localeCompare(b),
  );

  return { ranks, researchGroups, affiliations, formerStaffTypes };
}

export interface PublicStaffProfile {
  id: string;
  computedStaffSlug: string;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  academicRank: string | null;
  designation: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
  staffType: StaffType;
  staffStatus: StaffStatus;
  isInMemoriam: boolean;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  bio: string | null;
  education: string | null;
  researchInterests: string | null;
  membershipOfProfessionalOrganizations: string | null;
  primaryResearchGroup: { id: string; name: string; slug: string } | null;
  secondaryAffiliation: { id: string; name: string; acronym: string | null } | null;
  googleScholarUrl: string | null;
  orcidUrl: string | null;
}

/** Full staff profile by staff name slug. */
export async function getPublicStaffBySlug(slug: string): Promise<PublicStaffProfile | null> {
  const resolved = await resolvePublicStaffSlug(slug);
  if (!resolved) {
    return null;
  }

  const staff = await prisma.staff.findFirst({
    where: {
      id: resolved.staffId,
      ...wherePublicVisibleStaff(),
    },
    select: {
      id: true,
      title: true,
      firstName: true,
      middleName: true,
      lastName: true,
      institutionalEmail: true,
      staffType: true,
      staffStatus: true,
      academicRank: true,
      designation: true,
      academicLinkUrl: true,
      bio: true,
      education: true,
      researchInterests: true,
      membershipOfProfessionalOrganizations: true,
      profileImageUrl: true,
      isInMemoriam: true,
      dateOfBirth: true,
      dateOfDeath: true,
      secondaryAffiliation: {
        select: {
          id: true,
          name: true,
          acronym: true,
        },
      },
      researchMemberships: {
        where: {
          leftAt: null,
          researchGroup: {
            deletedAt: null,
          },
        },
        orderBy: [{ joinedAt: 'asc' }, { researchGroup: { name: 'asc' } }],
        take: 1,
        select: {
          researchGroup: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!staff) {
    return null;
  }

  const links = inferLinks(staff.academicLinkUrl);

  return {
    id: staff.id,
    computedStaffSlug: resolved.computedSlug,
    title: staff.title,
    firstName: staff.firstName,
    middleName: staff.middleName,
    lastName: staff.lastName,
    academicRank: staff.academicRank,
    designation: staff.designation,
    institutionalEmail: staff.institutionalEmail,
    profileImageUrl: staff.profileImageUrl,
    staffType: staff.staffType,
    staffStatus: staff.staffStatus,
    isInMemoriam: staff.isInMemoriam,
    dateOfBirth: staff.dateOfBirth,
    dateOfDeath: staff.dateOfDeath,
    bio: staff.bio,
    education: staff.education,
    researchInterests: staff.researchInterests,
    membershipOfProfessionalOrganizations: staff.membershipOfProfessionalOrganizations,
    primaryResearchGroup: staff.researchMemberships[0]
      ? {
          id: staff.researchMemberships[0].researchGroup.id,
          name: staff.researchMemberships[0].researchGroup.name,
          slug: staff.researchMemberships[0].researchGroup.slug,
        }
      : null,
    secondaryAffiliation: staff.secondaryAffiliation,
    googleScholarUrl: links.googleScholarUrl,
    orcidUrl: links.orcidUrl,
  };
}

export interface PublicTabQueryParams {
  page?: number;
  pageSize?: number;
}

function normalizePaging({ page = 1, pageSize = 8 }: PublicTabQueryParams = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 8;
  const skip = (safePage - 1) * safePageSize;
  return { safePage, safePageSize, skip };
}

export async function listPublicResearchOutputsForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const [items, total] = await Promise.all([
    prisma.researchOutput.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        authors: true,
        year: true,
        venue: true,
        sourceTitle: true,
        doi: true,
        url: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: safePageSize,
    }),
    prisma.researchOutput.count({ where }),
  ]);

  return {
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function listPublicProjectsForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        acronym: true,
        descriptionHtml: true,
        status: true,
        startYear: true,
        endYear: true,
      },
      orderBy: [{ startYear: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: safePageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function listPublicThesesForStaff(staffId: string, params: PublicTabQueryParams = {}) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const [items, total] = await Promise.all([
    prisma.studentThesis.findMany({
      where,
      select: {
        id: true,
        title: true,
        studentName: true,
        degreeLevel: true,
        programme: true,
        year: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: safePageSize,
    }),
    prisma.studentThesis.count({ where }),
  ]);

  return {
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function listPublicTeachingForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const [items, total] = await Promise.all([
    prisma.teachingResponsibility.findMany({
      where,
      select: {
        id: true,
        courseCode: true,
        title: true,
        semester: true,
        sessionYear: true,
      },
      orderBy: [{ sessionYear: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: safePageSize,
    }),
    prisma.teachingResponsibility.count({ where }),
  ]);

  return {
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function getPublicTributesForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);

  const [biography, items, total] = await Promise.all([
    prisma.departmentalTribute.findUnique({
      where: { staffId },
      select: {
        title: true,
        bodyHtml: true,
      },
    }),
    prisma.tributeTestimonial.findMany({
      where: {
        staffId,
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        relationship: true,
        tributeHtml: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
      skip,
      take: safePageSize,
    }),
    prisma.tributeTestimonial.count({
      where: {
        staffId,
        status: 'APPROVED',
      },
    }),
  ]);

  return {
    biography,
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

/** Current HOD info for public display. */
export async function getPublicCurrentHod() {
  const term = await prisma.leadershipTerm.findFirst({
    where: {
      role: 'HOD',
      endDate: null,
      staff: {
        deletedAt: null,
        isPublicProfile: true,
        staffStatus: { not: FORMER_STATUS, in: PUBLIC_VISIBLE_STAFF_STATUSES },
      },
    },
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
