'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { requireAuth, requireSuperAdmin, requireResearchLeadForGroup } from '@/lib/guards';
import { isSuperAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

const researchGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  abbreviation: z
    .string()
    .min(2, 'Abbreviation must be at least 2 characters')
    .max(10, 'Abbreviation must be at most 10 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  overview: z.string().max(50000).optional(),
});

type ResearchGroupInput = z.infer<typeof researchGroupSchema>;
const focusAreaTitleSchema = z
  .string()
  .trim()
  .min(1, 'Focus area title is required')
  .max(300, 'Focus area title must be at most 300 characters');

async function requireResearchGroupScopeAccess(
  session: Awaited<ReturnType<typeof requireAuth>>,
  groupId: string,
) {
  if (!isSuperAdmin(session)) {
    await requireResearchLeadForGroup(session, groupId);
  }
}

export async function createResearchGroup(data: ResearchGroupInput) {
  try {
    const session = await requireAuth();
    await requireSuperAdmin(session);

    const validated = researchGroupSchema.parse(data);

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    const group = await prisma.researchGroup.create({
      data: {
        name: validated.name,
        abbreviation: validated.abbreviation,
        slug: validated.slug,
        overview: normalize(validated.overview),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'RESEARCH_GROUP_CREATED',
      entityType: 'ResearchGroup',
      entityId: group.id,
      snapshot: validated,
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');

    return { success: true, groupId: group.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A group with this slug already exists.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create research group' };
  }
}

export async function updateResearchGroup(groupId: string, data: ResearchGroupInput) {
  try {
    const session = await requireAuth();

    await requireResearchGroupScopeAccess(session, groupId);

    const validated = researchGroupSchema.parse(data);

    const existing = await prisma.researchGroup.findFirst({
      where: { id: groupId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Research group not found' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    await prisma.researchGroup.update({
      where: { id: groupId },
      data: {
        name: validated.name,
        abbreviation: validated.abbreviation,
        slug: validated.slug,
        overview: normalize(validated.overview),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'RESEARCH_GROUP_UPDATED',
      entityType: 'ResearchGroup',
      entityId: groupId,
      snapshot: validated,
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A group with this slug already exists.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update research group' };
  }
}

export async function addFocusArea(researchGroupId: string, title: string) {
  try {
    const session = await requireAuth();
    await requireResearchGroupScopeAccess(session, researchGroupId);

    const parsedTitle = focusAreaTitleSchema.parse(title);

    const existing = await prisma.researchGroup.findFirst({
      where: { id: researchGroupId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: 'Research group not found' };
    }

    const maxOrder = await prisma.researchGroupFocusArea.aggregate({
      where: { researchGroupId, deletedAt: null },
      _max: { orderIndex: true },
    });
    const nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

    const focusArea = await prisma.researchGroupFocusArea.create({
      data: {
        researchGroupId,
        title: parsedTitle,
        orderIndex: nextOrder,
      },
      select: {
        id: true,
        title: true,
        orderIndex: true,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_ADDED',
      entityType: 'ResearchGroupFocusArea',
      entityId: focusArea.id,
      snapshot: {
        researchGroupId,
        title: focusArea.title,
        orderIndex: focusArea.orderIndex,
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    return { success: true, focusArea };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add focus area' };
  }
}

export async function updateFocusArea(id: string, title: string) {
  try {
    const session = await requireAuth();
    const parsedTitle = focusAreaTitleSchema.parse(title);

    const existing = await prisma.researchGroupFocusArea.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, researchGroupId: true, title: true },
    });
    if (!existing) {
      return { success: false, error: 'Focus area not found' };
    }

    await requireResearchGroupScopeAccess(session, existing.researchGroupId);

    const updated = await prisma.researchGroupFocusArea.update({
      where: { id },
      data: { title: parsedTitle },
      select: { id: true, title: true, orderIndex: true },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_UPDATED',
      entityType: 'ResearchGroupFocusArea',
      entityId: id,
      snapshot: {
        researchGroupId: existing.researchGroupId,
        previousTitle: existing.title,
        title: updated.title,
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    return { success: true, focusArea: updated };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update focus area' };
  }
}

export async function removeFocusArea(id: string) {
  try {
    const session = await requireAuth();

    const existing = await prisma.researchGroupFocusArea.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, researchGroupId: true, title: true, orderIndex: true },
    });
    if (!existing) {
      return { success: false, error: 'Focus area not found' };
    }

    await requireResearchGroupScopeAccess(session, existing.researchGroupId);

    await prisma.researchGroupFocusArea.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_REMOVED',
      entityType: 'ResearchGroupFocusArea',
      entityId: id,
      snapshot: {
        researchGroupId: existing.researchGroupId,
        title: existing.title,
        orderIndex: existing.orderIndex,
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to remove focus area' };
  }
}

export async function reorderFocusAreas(researchGroupId: string, orderedIds: string[]) {
  try {
    const session = await requireAuth();
    await requireResearchGroupScopeAccess(session, researchGroupId);

    const parsedIds = z.array(z.string().min(1)).parse(orderedIds);
    if (parsedIds.length === 0) {
      return { success: false, error: 'No focus areas to reorder.' };
    }

    const existing = await prisma.researchGroupFocusArea.findMany({
      where: {
        researchGroupId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    const existingIds = new Set(existing.map((item) => item.id));
    if (existingIds.size !== parsedIds.length || parsedIds.some((id) => !existingIds.has(id))) {
      return { success: false, error: 'Invalid focus area ordering payload.' };
    }

    await prisma.$transaction(
      parsedIds.map((id, index) =>
        prisma.researchGroupFocusArea.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_REORDERED',
      entityType: 'ResearchGroup',
      entityId: researchGroupId,
      snapshot: {
        orderedIds: parsedIds,
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to reorder focus areas' };
  }
}
