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
  focusAreas: z.string().max(50000).optional(),
});

type ResearchGroupInput = z.infer<typeof researchGroupSchema>;

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
        focusAreas: normalize(validated.focusAreas),
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

    // Allow superadmin or scoped lead
    if (!isSuperAdmin(session)) {
      await requireResearchLeadForGroup(session, groupId);
    }

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
        focusAreas: normalize(validated.focusAreas),
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
