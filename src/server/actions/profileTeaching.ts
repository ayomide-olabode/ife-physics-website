'use server';

import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const teachingSchema = z.object({
  courseCode: z.string().min(1, 'Course is required.'),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export async function createMyTeaching(
  data: z.input<typeof teachingSchema>,
  options?: { staffId?: string; basePath?: string },
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = teachingSchema.parse(data);

    const targetStaffId = options?.staffId?.trim() || session.user.staffId;
    if (!targetStaffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, targetStaffId);

    const course = await prisma.course.findFirst({
      where: { code: validated.courseCode, deletedAt: null },
      select: { code: true, title: true },
    });

    if (!course) {
      return {
        success: false,
        error: 'Course not found. Please contact an administrator to add it.',
      };
    }

    const newDoc = await prisma.teachingResponsibility.create({
      data: {
        staffId: targetStaffId,
        title: course.title,
        courseCode: course.code,
      },
      select: { id: true },
    });

    revalidatePath('/dashboard/profile/teaching');
    revalidatePath(`/dashboard/admin/staff/${targetStaffId}/teaching`);
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
  options?: { staffId?: string; basePath?: string },
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = teachingSchema.parse(data);

    const targetStaffId = options?.staffId?.trim() || session.user.staffId;
    if (!targetStaffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, targetStaffId);

    const existing = await prisma.teachingResponsibility.findFirst({
      where: {
        id,
        staffId: targetStaffId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Record not found or access denied.' };
    }

    const course = await prisma.course.findFirst({
      where: { code: validated.courseCode, deletedAt: null },
      select: { code: true, title: true },
    });

    if (!course) {
      return {
        success: false,
        error: 'Course not found. Please contact an administrator to add it.',
      };
    }

    await prisma.teachingResponsibility.update({
      where: { id },
      data: {
        title: course.title,
        courseCode: course.code,
      },
    });

    revalidatePath('/dashboard/profile/teaching');
    revalidatePath(`/dashboard/admin/staff/${targetStaffId}/teaching`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update teaching record:', error);
    return { success: false, error: 'Encountered database error.' };
  }
}

export async function deleteMyTeaching(
  id: string,
  options?: { staffId?: string; basePath?: string },
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const targetStaffId = options?.staffId?.trim() || session.user.staffId;
    if (!targetStaffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, targetStaffId);

    const existing = await prisma.teachingResponsibility.findFirst({
      where: {
        id,
        staffId: targetStaffId,
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
    revalidatePath(`/dashboard/admin/staff/${targetStaffId}/teaching`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete teaching record:', error);
    return { success: false, error: 'Failed to delete record.' };
  }
}
