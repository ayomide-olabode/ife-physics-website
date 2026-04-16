'use server';

import prisma from '@/lib/prisma';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function createUser({ staffId }: { staffId: string }) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  if (!staffId) {
    return { error: 'Staff ID is required.' };
  }

  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      return { error: 'The specified staff record does not exist.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { staffId },
    });
    if (existingUser) {
      return { error: 'A user account already exists for this staff member.' };
    }

    const newUser = await prisma.user.create({
      data: {
        staffId,
        passwordHash: '',
        isSuperAdmin: false,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'CREATE',
      entityType: 'User',
      entityId: newUser.id,
      snapshot: {
        createdUserId: newUser.id,
        staffId: newUser.staffId,
        isSuperAdmin: newUser.isSuperAdmin,
      },
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true, userId: newUser.id };
  } catch (err) {
    console.error('Error creating user:', err);
    return { error: 'An unexpected error occurred while creating the user.' };
  }
}

export async function updateUserSuperAdmin({
  userId,
  isSuperAdmin,
}: {
  userId: string;
  isSuperAdmin: boolean;
}) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isSuperAdmin: true },
    });

    if (!user) {
      return { error: 'User account was not found.' };
    }

    if (user.id === session.user.userId) {
      return { error: 'You cannot change your own Super Admin assignment.' };
    }

    if (user.isSuperAdmin === isSuperAdmin) {
      return { success: true, unchanged: true };
    }

    if (!isSuperAdmin && user.isSuperAdmin) {
      const totalSuperAdmins = await prisma.user.count({
        where: { isSuperAdmin: true },
      });

      if (totalSuperAdmins <= 1) {
        return { error: 'At least one Super Admin must remain assigned at all times.' };
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin },
      select: { id: true, staffId: true, isSuperAdmin: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: isSuperAdmin ? 'SUPER_ADMIN_GRANTED' : 'SUPER_ADMIN_REVOKED',
      entityType: 'User',
      entityId: updated.id,
      snapshot: {
        staffId: updated.staffId,
        isSuperAdmin: updated.isSuperAdmin,
      },
    });

    revalidatePath('/dashboard/admin/users');
    revalidatePath(`/dashboard/admin/users/${userId}`);
    revalidatePath('/dashboard/admin/staff');
    revalidatePath(`/dashboard/admin/staff/${updated.staffId}`);

    return { success: true, unchanged: false };
  } catch (err) {
    console.error('Error updating super admin assignment:', err);
    return { error: 'An unexpected error occurred while updating super admin assignment.' };
  }
}
