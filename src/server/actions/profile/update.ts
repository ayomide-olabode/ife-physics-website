'use server';

import { ACADEMIC_RANK_VALUES, STAFF_TITLE_OPTIONS } from '@/lib/options';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateProfileSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .refine(
      (value) => STAFF_TITLE_OPTIONS.includes(value as (typeof STAFF_TITLE_OPTIONS)[number]),
      {
        message: 'Title is required.',
      },
    ),
  firstName: z.string().min(1, 'First name is strictly required.'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is strictly required.'),
  academicRank: z.union([z.enum(ACADEMIC_RANK_VALUES), z.literal('')]).optional(),
  designation: z.string().max(200, 'Designation must be 200 characters or fewer.').optional(),
});

export async function updateStaffProfile(data: {
  title: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  academicRank?: string;
  designation?: string;
}) {
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

    const { title, firstName, middleName, lastName, academicRank, designation } = parsed.data;

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        title,
        firstName: firstName.trim(),
        middleName: middleName?.trim() ? middleName.trim() : null,
        lastName: lastName.trim(),
        academicRank: academicRank ? academicRank : null,
        designation: designation?.trim() ? designation.trim() : null,
      },
    });

    revalidatePath('/dashboard/profile/overview');
    revalidatePath('/dashboard/admin/staff');

    return { success: true };
  } catch (error) {
    console.error('Update Profile Error:', error);
    return { error: 'Failed to update profile.' };
  }
}
