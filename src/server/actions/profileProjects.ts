'use server';

import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().max(2000, 'Description heavily limited up to 2000 chars.').optional(),
  url: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export async function createMyProject(
  data: z.infer<typeof projectSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = projectSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    const newDoc = await prisma.project.create({
      data: {
        staffId,
        title: validated.title,
        description: validated.description || null,
        url: validated.url || null,
      },
      select: { id: true },
    });

    revalidatePath('/dashboard/profile/projects');
    return { success: true, data: newDoc };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create project:', error);
    return { success: false, error: 'Database mutation failed securely.' };
  }
}

export async function updateMyProject(
  id: string,
  data: z.infer<typeof projectSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = projectSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    // Verify it exists AND belongs to the user
    const existing = await prisma.project.findFirst({
      where: {
        id,
        staffId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Project payload missing or unauthorized matching ownership restrictions.',
      };
    }

    await prisma.project.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description || null,
        url: validated.url || null,
      },
    });

    revalidatePath('/dashboard/profile/projects');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update project:', error);
    return { success: false, error: 'Secure Database limits blocked mutation.' };
  }
}

export async function deleteMyProject(id: string): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'Invalid profile identity tracking bounds.' };
    }

    await requireStaffOwnership(session, staffId);

    const existing = await prisma.project.findFirst({
      where: {
        id,
        staffId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Mapping failure securely ignoring entity deletes.' };
    }

    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/profile/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return {
      success: false,
      error: 'Server blocked secure schema overrides internally resolving states gracefully.',
    };
  }
}
