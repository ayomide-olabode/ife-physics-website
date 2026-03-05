'use server';

import { requireAuth, requireGlobalRole } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ScopedRole } from '.prisma/client';

const BASE_PATH = '/dashboard/communication/events-opportunities';

const eoSchema = z
  .object({
    title: z.string().min(1, 'Title is required.').max(200),
    type: z.enum(['EVENT', 'OPPORTUNITY']),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    venue: z.string().max(200).optional().or(z.literal('')),
    link: z.string().url().optional().or(z.literal('')),
    deadline: z.string().optional().or(z.literal('')),
  })
  .refine(
    (d) => {
      if (d.startDate && d.endDate) {
        return new Date(d.startDate) <= new Date(d.endDate);
      }
      return true;
    },
    { message: 'Start date must be before or equal to end date.', path: ['endDate'] },
  );

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: { id: string };
};

export async function createEventOpportunity(
  data: z.infer<typeof eoSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = eoSchema.parse(data);

    const item = await prisma.eventOpportunity.create({
      data: {
        title: v.title,
        type: v.type,
        startDate: v.startDate ? new Date(v.startDate) : null,
        endDate: v.endDate ? new Date(v.endDate) : null,
        venue: v.venue || null,
        link: v.link || null,
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
      snapshot: { title: v.title, type: v.type },
    });

    revalidatePath(BASE_PATH);
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
  data: z.infer<typeof eoSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = eoSchema.parse(data);

    await prisma.eventOpportunity.update({
      where: { id },
      data: {
        title: v.title,
        type: v.type,
        startDate: v.startDate ? new Date(v.startDate) : null,
        endDate: v.endDate ? new Date(v.endDate) : null,
        venue: v.venue || null,
        link: v.link || null,
        deadline: v.deadline ? new Date(v.deadline) : null,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_UPDATED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: { title: v.title, type: v.type },
    });

    revalidatePath(BASE_PATH);
    revalidatePath(`${BASE_PATH}/${id}`);
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

    revalidatePath(BASE_PATH);
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

    revalidatePath(BASE_PATH);
    revalidatePath(`${BASE_PATH}/${id}`);
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

    revalidatePath(BASE_PATH);
    revalidatePath(`${BASE_PATH}/${id}`);
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

    revalidatePath(BASE_PATH);
    revalidatePath(`${BASE_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to archive:', error);
    return { success: false, error: 'Failed to archive.' };
  }
}
