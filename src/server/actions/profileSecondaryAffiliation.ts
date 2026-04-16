'use server';

import prisma from '@/lib/prisma';
import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function updateMySecondaryAffiliation(
  input: {
    secondaryAffiliationId: string | null;
  },
  options?: { staffId?: string },
) {
  try {
    const session = await requireAuth();
    const targetStaffId = options?.staffId?.trim() || session.user.staffId;

    if (!targetStaffId) {
      return { error: 'No staff record linked to this user.' };
    }

    requireStaffOwnership(session, targetStaffId);

    const nextAffiliationId = input.secondaryAffiliationId;

    if (nextAffiliationId) {
      const exists = await prisma.secondaryAffiliation.findUnique({
        where: { id: nextAffiliationId },
        select: { id: true },
      });
      if (!exists) {
        return { error: 'Selected secondary affiliation does not exist.' };
      }
    }

    const existing = await prisma.staff.findUnique({
      where: { id: targetStaffId },
      select: { secondaryAffiliationId: true },
    });

    await prisma.staff.update({
      where: { id: targetStaffId },
      data: {
        secondaryAffiliationId: nextAffiliationId,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'SECONDARY_AFFILIATION_UPDATED',
      entityType: 'Staff',
      entityId: targetStaffId,
      snapshot: {
        actorUserId: session.user.userId,
        actorStaffId: session.user.staffId,
        targetStaffId,
        previousSecondaryAffiliationId: existing?.secondaryAffiliationId ?? null,
        secondaryAffiliationId: nextAffiliationId,
      },
    });

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/profile/overview');
    revalidatePath(`/dashboard/admin/staff/${targetStaffId}/profile`);
    revalidatePath('/dashboard/admin/secondary-affiliations');

    if (existing?.secondaryAffiliationId) {
      revalidatePath(`/dashboard/admin/secondary-affiliations/${existing.secondaryAffiliationId}`);
    }
    if (nextAffiliationId) {
      revalidatePath(`/dashboard/admin/secondary-affiliations/${nextAffiliationId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update secondary affiliation:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
