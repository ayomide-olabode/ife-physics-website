'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { PublishStatus, ScopedRole } from '@prisma/client';

const resourceSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(300),
    description: z.string().min(1, 'Description is required').max(1000),
    linkUrl: z.string().max(1000).optional().nullable(),
    fileUrl: z.string().max(1000).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
  })
  .refine((data) => data.linkUrl || data.fileUrl, {
    message: 'Either an external link or an uploaded file is required.',
    path: ['linkUrl'], // Attach error to linkUrl field
  });

export async function createResource(data: z.infer<typeof resourceSchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = resourceSchema.parse(data);

  const entry = await prisma.resourceItem.create({
    data: {
      ...parsed,
      status: PublishStatus.DRAFT,
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'RESOURCE_CREATED',
    entityType: 'ResourceItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('resources');
  revalidatePath('/resources');
  revalidatePath('/');

  return entry;
}

export async function updateResource(id: string, data: z.infer<typeof resourceSchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = resourceSchema.parse(data);

  const entry = await prisma.resourceItem.update({
    where: { id },
    data: parsed,
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'RESOURCE_UPDATED',
    entityType: 'ResourceItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('resources');
  revalidatePath('/resources');
  revalidatePath('/');

  return entry;
}

export async function setResourceStatus(id: string, status: PublishStatus) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const entry = await prisma.resourceItem.update({
    where: { id },
    data: {
      status,
      publishedAt: status === PublishStatus.PUBLISHED ? new Date() : undefined,
      archivedAt: status === PublishStatus.ARCHIVED ? new Date() : undefined,
    },
  });

  let action = 'RESOURCE_UPDATED';
  if (status === PublishStatus.PUBLISHED) action = 'RESOURCE_PUBLISHED';
  if (status === PublishStatus.DRAFT) action = 'RESOURCE_UNPUBLISHED';
  if (status === PublishStatus.ARCHIVED) action = 'RESOURCE_ARCHIVED';

  await logAudit({
    actorId: session.user.userId,
    action,
    entityType: 'ResourceItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('resources');
  revalidatePath('/resources');
  revalidatePath('/');

  return entry;
}

export async function deleteResource(id: string) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const entry = await prisma.resourceItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'RESOURCE_DELETED',
    entityType: 'ResourceItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('resources');
  revalidatePath('/resources');
  revalidatePath('/');

  return entry;
}
