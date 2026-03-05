'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/guards';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is strictly required.'),
  lastName: z.string().min(1, 'Last name is strictly required.'),
});

export async function updateStaffProfile(data: { firstName: string; lastName: string }) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;

    if (!staffId) {
      return { error: 'No associated staff record found for your account.' };
    }

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { firstName, lastName } = parsed.data;

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/admin/staff');

    return { success: true };
  } catch (error) {
    console.error('Update Profile Error:', error);
    return { error: 'Failed to update profile.' };
  }
}
