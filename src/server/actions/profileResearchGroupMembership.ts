'use server';

import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/guards';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateMyResearchGroupMembership({
  researchGroupId,
}: {
  researchGroupId: string | null;
}) {
  try {
    const session = await requireAuth();
    const staffId = session.user.staffId;

    if (!staffId) {
      return { error: 'No staff record linked to this user.' };
    }

    if (researchGroupId) {
      const groupExists = await prisma.researchGroup.findUnique({
        where: { id: researchGroupId },
      });
      if (!groupExists || groupExists.deletedAt) {
        return { error: 'Selected research group does not exist.' };
      }
    }

    await prisma.$transaction(async (tx) => {
      // Remove all current memberships to enforce a single primary group
      await tx.researchGroupMembership.deleteMany({
        where: { staffId },
      });

      if (researchGroupId) {
        // Create new membership
        await tx.researchGroupMembership.create({
          data: {
            staffId,
            researchGroupId,
            joinedAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: session.user.userId,
          action: 'STAFF_RESEARCH_GROUP_UPDATED',
          entityType: 'Staff',
          entityId: staffId,
          snapshot: { researchGroupId },
        },
      });
    });

    revalidatePath('/dashboard/profile');
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');

    return { success: true };
  } catch (error) {
    console.error('Failed to update research group membership:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
