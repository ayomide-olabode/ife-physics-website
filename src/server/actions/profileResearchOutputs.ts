'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import { z } from 'zod';
import { Prisma, ResearchOutputType } from '@prisma/client';

const researchOutputSchema = z
  .object({
    type: z.nativeEnum(ResearchOutputType, { message: 'Invalid output type' }),
    title: z.string().min(1, 'Title is required.'),
    authors: z.string().min(1, 'Authors are required.'),
    year: z.coerce
      .number()
      .int()
      .min(1900, 'Year must be 1900 or later.')
      .max(new Date().getFullYear() + 1, 'Year is too far in the future.'),
    venue: z.string().nullable().optional(),
    url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
    doi: z.string().nullable().optional(),
    metaJson: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const meta = (data.metaJson || {}) as Record<string, string>;
    const chk = (val: unknown) => typeof val === 'string' && val.trim().length > 0;

    if (data.type === 'JOURNAL_ARTICLE') {
      if (!chk(meta.journalName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Journal name is required.',
          path: ['journalName'],
        });
      }
    } else if (data.type === 'CONFERENCE_PAPER') {
      if (!chk(meta.conferenceName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Conference name is required.',
          path: ['conferenceName'],
        });
      }
    } else if (data.type === 'BOOK') {
      if (!chk(meta.publisher)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Publisher is required.',
          path: ['publisher'],
        });
      }
    } else if (data.type === 'BOOK_CHAPTER') {
      if (!chk(meta.bookTitle)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Book title is required.',
          path: ['bookTitle'],
        });
      }
    } else if (data.type === 'PATENT') {
      if (!chk(meta.patentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Patent number is required.',
          path: ['patentNumber'],
        });
      }
    } else if (data.type === 'DATA' || data.type === 'SOFTWARE') {
      if (!chk(meta.repository)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Repository is required.',
          path: ['repository'],
        });
      }
    } else if (data.type === 'REPORT') {
      if (!chk(meta.institution) && !chk(meta.publisher)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Institution or publisher is required.',
          path: ['institution'],
        });
      }
    } else if (data.type === 'THESIS') {
      if (!chk(meta.awardingInstitution)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Awarding institution is required.',
          path: ['awardingInstitution'],
        });
      }
    }
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
        authors: validData.authors.trim(),
        year: validData.year,
        venue: validData.venue?.trim() || null,
        url: validData.url?.trim() || null,
        doi: validData.doi?.trim() || null,
        metaJson: (validData.metaJson || undefined) as Prisma.InputJsonValue | undefined,
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
        authors: validData.authors.trim(),
        year: validData.year,
        venue: validData.venue?.trim() || null,
        url: validData.url?.trim() || null,
        doi: validData.doi?.trim() || null,
        metaJson: (validData.metaJson || undefined) as Prisma.InputJsonValue | undefined,
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
