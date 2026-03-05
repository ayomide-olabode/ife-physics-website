'use server';

import { requireAuth, requireGlobalRole } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  ScopedRole,
  EventOpportunityKind,
  EventCategory,
  OpportunityCategory,
} from '.prisma/client';

const EO_PATH = '/dashboard/communication/events-opportunities';

const baseSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200),
  kind: z.nativeEnum(EventOpportunityKind),
  eventCategory: z.nativeEnum(EventCategory).nullable().optional(),
  opportunityCategory: z.nativeEnum(OpportunityCategory).nullable().optional(),
  description: z.string().max(4000).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  venue: z.string().max(200).optional().or(z.literal('')),
  linkUrl: z.string().url().optional().or(z.literal('')),
  deadline: z.string().optional().or(z.literal('')),
});

const eoSchema = baseSchema.superRefine((data, ctx) => {
  if (data.kind === 'EVENT') {
    if (!data.eventCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Category is required for Events.',
        path: ['eventCategory'],
      });
    }
  }
  if (data.kind === 'OPPORTUNITY') {
    if (!data.opportunityCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Category is required for Opportunities.',
        path: ['opportunityCategory'],
      });
    }
  }
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: { id: string };
};

export async function createEventOpportunity(
  data: z.infer<typeof baseSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = eoSchema.parse(data);

    const item = await prisma.eventOpportunity.create({
      data: {
        title: v.title,
        kind: v.kind,
        eventCategory: v.kind === 'EVENT' ? (v.eventCategory ?? null) : null,
        opportunityCategory: v.kind === 'OPPORTUNITY' ? (v.opportunityCategory ?? null) : null,
        description: v.description || null,
        startDate: v.startDate ? new Date(v.startDate) : null,
        endDate: v.endDate ? new Date(v.endDate) : null,
        venue: v.venue || null,
        linkUrl: v.linkUrl || null,
        deadline: v.deadline ? new Date(v.deadline) : null,
        status: 'DRAFT',
      },
      select: { id: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_CREATED',
      entityType: 'EventOpportunity',
      entityId: item.id,
      snapshot: { title: v.title, kind: v.kind },
    });

    revalidatePath(EO_PATH);
    return { success: true, data: { id: item.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create event/opportunity:', error);
    return { success: false, error: 'Failed to create.' };
  }
}

export async function updateEventOpportunity(
  id: string,
  data: z.infer<typeof baseSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = eoSchema.parse(data);

    await prisma.eventOpportunity.update({
      where: { id },
      data: {
        title: v.title,
        kind: v.kind,
        eventCategory: v.kind === 'EVENT' ? (v.eventCategory ?? null) : null,
        opportunityCategory: v.kind === 'OPPORTUNITY' ? (v.opportunityCategory ?? null) : null,
        description: v.description || null,
        startDate: v.startDate ? new Date(v.startDate) : null,
        endDate: v.endDate ? new Date(v.endDate) : null,
        venue: v.venue || null,
        linkUrl: v.linkUrl || null,
        deadline: v.deadline ? new Date(v.deadline) : null,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_UPDATED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: { title: v.title, kind: v.kind },
    });

    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update event/opportunity:', error);
    return { success: false, error: 'Failed to update.' };
  }
}

export async function deleteEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_DELETED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete:', error);
    return { success: false, error: 'Failed to delete.' };
  }
}

export async function publishEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_PUBLISHED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish:', error);
    return { success: false, error: 'Failed to publish.' };
  }
}

export async function unpublishEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_UNPUBLISHED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish:', error);
    return { success: false, error: 'Failed to unpublish.' };
  }
}

export async function archiveEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_ARCHIVED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to archive:', error);
    return { success: false, error: 'Failed to archive.' };
  }
}
