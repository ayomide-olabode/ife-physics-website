'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function updateStaffProfile(data: {
  staffId: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return { error: 'Unauthorized.' };
    }

    // Ensure they own this staff record OR they are superadmin
    if (session.user.staffId !== data.staffId && !session.user.isSuperAdmin) {
      return { error: 'Permission denied.' };
    }

    const { staffId, firstName, lastName } = data;

    if (!firstName?.trim() || !lastName?.trim()) {
      return { error: 'First and last names are strictly required.' };
    }

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
    console.error('Update Profile ERror:', error);
    return { error: 'Failed to update profile.' };
  }
}
