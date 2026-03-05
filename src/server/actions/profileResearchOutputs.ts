'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import { z } from 'zod';
import { ResearchOutputType } from '@prisma/client';

const researchOutputSchema = z.object({
  type: z.nativeEnum(ResearchOutputType, { message: 'Invalid output type' }),
  title: z.string().min(1, 'Title is strictly required.'),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later.')
    .max(new Date().getFullYear() + 1, 'Year is too far in the future.')
    .nullable()
    .optional(),
  venue: z.string().nullable().optional(),
  url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  doi: z.string().nullable().optional(),
});

export async function createMyResearchOutput(data: z.infer<typeof researchOutputSchema>) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;
    if (!staffId) return { error: 'No associated staff record found.' };

    requireStaffOwnership(session, staffId);

    const parsed = researchOutputSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const validData = parsed.data;

    await prisma.researchOutput.create({
      data: {
        staffId,
        type: validData.type,
        title: validData.title.trim(),
        year: validData.year,
        venue: validData.venue?.trim() || null,
        url: validData.url?.trim() || null,
        doi: validData.doi?.trim() || null,
      },
    });

    revalidatePath('/dashboard/profile/research-outputs');
    return { success: true };
  } catch (error) {
    console.error('Create Research Output Error:', error);
    return { error: 'Failed to create research output.' };
  }
}

export async function updateMyResearchOutput(
  id: string,
  data: z.infer<typeof researchOutputSchema>,
) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;
    if (!staffId) return { error: 'No associated staff record found.' };

    requireStaffOwnership(session, staffId);

    // Verify ownership of the item
    const existing = await prisma.researchOutput.findUnique({
      where: { id },
      select: { staffId: true },
    });

    if (!existing || existing.staffId !== staffId) {
      return { error: 'Record not found or access denied.' };
    }

    const parsed = researchOutputSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const validData = parsed.data;

    await prisma.researchOutput.update({
      where: { id },
      data: {
        type: validData.type,
        title: validData.title.trim(),
        year: validData.year,
        venue: validData.venue?.trim() || null,
        url: validData.url?.trim() || null,
        doi: validData.doi?.trim() || null,
      },
    });

    revalidatePath('/dashboard/profile/research-outputs');
    return { success: true };
  } catch (error) {
    console.error('Update Research Output Error:', error);
    return { error: 'Failed to update research output.' };
  }
}

export async function deleteMyResearchOutput(id: string) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;
    if (!staffId) return { error: 'No associated staff record found.' };

    requireStaffOwnership(session, staffId);

    // Verify ownership of the item
    const existing = await prisma.researchOutput.findUnique({
      where: { id },
      select: { staffId: true },
    });

    if (!existing || existing.staffId !== staffId) {
      return { error: 'Record not found or access denied.' };
    }

    // Soft delete
    await prisma.researchOutput.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath('/dashboard/profile/research-outputs');
    return { success: true };
  } catch (error) {
    console.error('Delete Research Output Error:', error);
    return { error: 'Failed to delete research output.' };
  }
}
