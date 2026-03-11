'use server';

import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const currentYear = new Date().getFullYear();

const teachingSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  courseCode: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, 'Course code must only contain letters and numbers.')
    .max(20, 'Course code is too long.')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.toUpperCase() : undefined)),
  sessionYear: z.coerce
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later.')
    .max(currentYear + 1, 'Year is too far in the future.')
    .nullable()
    .optional(),
  semester: z.string().max(50, 'Semester name is too long.').optional().or(z.literal('')),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export async function createMyTeaching(
  data: z.input<typeof teachingSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = teachingSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    const newDoc = await prisma.teachingResponsibility.create({
      data: {
        staffId,
        title: validated.title,
        courseCode: validated.courseCode || null,
        sessionYear: validated.sessionYear,
        semester: validated.semester || null,
      },
      select: { id: true },
    });

    revalidatePath('/dashboard/profile/teaching');
    return { success: true, data: newDoc };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create teaching record:', error);
    return { success: false, error: 'Failed to save record.' };
  }
}

export async function updateMyTeaching(
  id: string,
  data: z.input<typeof teachingSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = teachingSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    const existing = await prisma.teachingResponsibility.findFirst({
      where: {
        id,
        staffId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Record not found or access denied.' };
    }

    await prisma.teachingResponsibility.update({
      where: { id },
      data: {
        title: validated.title,
        courseCode: validated.courseCode || null,
        sessionYear: validated.sessionYear,
        semester: validated.semester || null,
      },
    });

    revalidatePath('/dashboard/profile/teaching');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update teaching record:', error);
    return { success: false, error: 'Encountered database error.' };
  }
}

export async function deleteMyTeaching(id: string): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    const existing = await prisma.teachingResponsibility.findFirst({
      where: {
        id,
        staffId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Record not found or access denied.' };
    }

    await prisma.teachingResponsibility.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/profile/teaching');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete teaching record:', error);
    return { success: false, error: 'Failed to delete record.' };
  }
}
