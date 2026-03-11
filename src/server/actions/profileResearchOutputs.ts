'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import { z } from 'zod';
import { Prisma, ResearchOutputType } from '@prisma/client';
import { mergeMetaJson, deriveAuthorsString } from '@/lib/legacyResearchOutputCompat';

/* ── sub-schemas ── */

const authorObjectSchema = z.object({
  staffId: z.string().nullable().optional(),
  given_name: z.string().min(1, 'First name is required.'),
  middle_name: z.string().nullable().optional(),
  family_name: z.string(),
  suffix: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  is_group: z.boolean().nullable().optional(),
});

/* ── main schema ── */

const researchOutputSchema = z
  .object({
    type: z.nativeEnum(ResearchOutputType, { message: 'Invalid output type' }),
    title: z.string().min(1, 'Title is required.'),

    // legacy flat string — kept for backward compat / list display
    authors: z.string().optional().default(''),

    // structured
    authorsJson: z.array(authorObjectSchema).optional().nullable(),
    groupAuthor: z.string().optional().nullable(),

    // date
    year: z.coerce
      .number()
      .int()
      .min(1900, 'Year must be 1900 or later.')
      .max(new Date().getFullYear() + 1, 'Year is too far in the future.')
      .optional()
      .nullable(),
    fullDate: z.string().optional().nullable(), // ISO date string

    // common text
    subtitle: z.string().optional().nullable(),
    sourceTitle: z.string().optional().nullable(),
    publisher: z.string().optional().nullable(),
    doi: z.string().optional().nullable(),
    url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
    language: z.string().optional().nullable(),
    abstract: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),

    // json
    keywordsJson: z.array(z.string()).optional().nullable(),
    metaJson: z.record(z.string(), z.unknown()).optional().nullable(),

    // kept but unused if empty
    venue: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    /* ── At least one date ── */
    if (!data.year && !data.fullDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Year or full date is required.',
        path: ['year'],
      });
    }

    /* ── At least one author or group author ── */
    const hasAuthors =
      (data.authorsJson && data.authorsJson.length > 0) ||
      (data.authors && data.authors.trim().length > 0);
    const hasGroup = data.groupAuthor && data.groupAuthor.trim().length > 0;
    if (!hasAuthors && !hasGroup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one author or group author is required.',
        path: ['authors'],
      });
    }

    /* ── Type-specific validation ── */
    const meta = (data.metaJson || {}) as Record<string, string>;
    const chk = (val: unknown) => typeof val === 'string' && val.trim().length > 0;

    if (data.type === 'JOURNAL_ARTICLE') {
      if (!chk(meta.journal_title)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Journal title is required.',
          path: ['metaJson'],
        });
      }
      if (!chk(meta.volume)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Volume is required.',
          path: ['metaJson'],
        });
      }
      if (!chk(meta.pages) && !chk(meta.article_number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pages or article number is required.',
          path: ['metaJson'],
        });
      }
    } else if (data.type === 'BOOK') {
      if (!chk(data.publisher) && !chk(meta.publisher)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Publisher is required for books.',
          path: ['publisher'],
        });
      }
    } else if (data.type === 'BOOK_CHAPTER') {
      if (!chk(meta.book_title)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Book title is required.',
          path: ['metaJson'],
        });
      }
      if (!chk(data.publisher) && !chk(meta.publisher)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Publisher is required.',
          path: ['publisher'],
        });
      }
    } else if (data.type === 'CONFERENCE_PAPER') {
      if (!chk(meta.conference_name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Conference name is required.',
          path: ['metaJson'],
        });
      }
    } else if (data.type === 'SOFTWARE') {
      if (!chk(meta.software_title)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Software title is required.',
          path: ['metaJson'],
        });
      }
    } else if (data.type === 'DATA') {
      if (!chk(meta.repository)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Repository is required for datasets.',
          path: ['metaJson'],
        });
      }
    } else if (data.type === 'PATENT') {
      if (!chk(meta.patent_number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Patent number is required.',
          path: ['metaJson'],
        });
      }
      if (!chk(meta.patent_office)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Patent office is required.',
          path: ['metaJson'],
        });
      }
    } else if (data.type === 'REPORT') {
      if (!chk(meta.issuing_organization) && !chk(data.publisher)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Issuing organization or publisher is required.',
          path: ['metaJson'],
        });
      }
    } else if (data.type === 'THESIS') {
      if (!chk(meta.degree_type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Degree type is required.',
          path: ['metaJson'],
        });
      }
      if (!chk(meta.institution)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Institution is required.',
          path: ['metaJson'],
        });
      }
    }
  });

/* ── Helpers ── */

function buildPersistData(validData: z.infer<typeof researchOutputSchema>) {
  // Derive flat authors string from structured data
  const flatAuthors =
    deriveAuthorsString(validData.authorsJson, validData.groupAuthor) ||
    validData.authors?.trim() ||
    '';

  return {
    type: validData.type,
    title: validData.title.trim(),
    authors: flatAuthors,
    year:
      validData.year ?? (validData.fullDate ? new Date(validData.fullDate).getFullYear() : null),
    venue: validData.venue?.trim() || null,
    url: validData.url?.trim() || null,
    doi: validData.doi?.trim() || null,
    groupAuthor: validData.groupAuthor?.trim() || null,
    fullDate: validData.fullDate ? new Date(validData.fullDate) : null,
    subtitle: validData.subtitle?.trim() || null,
    sourceTitle: validData.sourceTitle?.trim() || null,
    publisher: validData.publisher?.trim() || null,
    language: validData.language?.trim() || null,
    abstract: validData.abstract?.trim() || null,
    notes: validData.notes?.trim() || null,
    authorsJson: (validData.authorsJson || undefined) as Prisma.InputJsonValue | undefined,
    keywordsJson: (validData.keywordsJson || undefined) as Prisma.InputJsonValue | undefined,
    metaJson: (validData.metaJson || undefined) as Prisma.InputJsonValue | undefined,
  };
}

/* ── Actions ── */

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

    await prisma.researchOutput.create({
      data: {
        staffId,
        ...buildPersistData(parsed.data),
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

    const existing = await prisma.researchOutput.findUnique({
      where: { id },
      select: { staffId: true, metaJson: true },
    });

    if (!existing || existing.staffId !== staffId) {
      return { error: 'Record not found or access denied.' };
    }

    const parsed = researchOutputSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const persistData = buildPersistData(parsed.data);

    // Merge metaJson: preserve unknown keys from existing record
    const existingMeta =
      existing.metaJson &&
      typeof existing.metaJson === 'object' &&
      !Array.isArray(existing.metaJson)
        ? (existing.metaJson as Record<string, unknown>)
        : {};
    const incomingMeta =
      persistData.metaJson && typeof persistData.metaJson === 'object'
        ? (persistData.metaJson as Record<string, unknown>)
        : {};
    const mergedMeta = mergeMetaJson(existingMeta, incomingMeta);

    await prisma.researchOutput.update({
      where: { id },
      data: {
        ...persistData,
        metaJson:
          Object.keys(mergedMeta).length > 0
            ? (mergedMeta as Prisma.InputJsonValue)
            : Prisma.DbNull,
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

    const existing = await prisma.researchOutput.findUnique({
      where: { id },
      select: { staffId: true },
    });

    if (!existing || existing.staffId !== staffId) {
      return { error: 'Record not found or access denied.' };
    }

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
