'use server';

import prisma from '@/lib/prisma';
import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateMyResearchGroupMembership(
  {
    researchGroupId,
    focusAreaIds = [],
  }: {
    researchGroupId: string | null;
    focusAreaIds?: string[];
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

    const normalizedFocusAreaIds = Array.from(
      new Set(focusAreaIds.map((id) => id.trim()).filter((id) => id.length > 0)),
    );

    if (!researchGroupId && normalizedFocusAreaIds.length > 0) {
      return { error: 'Select a research group before selecting focus areas.' };
    }

    if (researchGroupId) {
      const groupExists = await prisma.researchGroup.findUnique({
        where: { id: researchGroupId },
      });
      if (!groupExists || groupExists.deletedAt) {
        return { error: 'Selected research group does not exist.' };
      }

      if (normalizedFocusAreaIds.length > 0) {
        const validFocusAreas = await prisma.focusArea.findMany({
          where: {
            id: { in: normalizedFocusAreaIds },
            researchGroupId,
            deletedAt: null,
            researchGroup: {
              deletedAt: null,
            },
          },
          select: { id: true },
        });
        if (validFocusAreas.length !== normalizedFocusAreaIds.length) {
          return {
            error: 'One or more selected focus areas are invalid for the selected research group.',
          };
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Remove all current memberships to enforce a single primary group
      await tx.researchGroupMembership.deleteMany({
        where: { staffId: targetStaffId },
      });

      await tx.staffFocusAreaSelection.deleteMany({
        where: { staffId: targetStaffId },
      });

      if (researchGroupId) {
        // Create new membership
        await tx.researchGroupMembership.create({
          data: {
            staffId: targetStaffId,
            researchGroupId,
            joinedAt: new Date(),
          },
        });

        if (normalizedFocusAreaIds.length > 0) {
          await tx.staffFocusAreaSelection.createMany({
            data: normalizedFocusAreaIds.map((focusAreaId) => ({
              staffId: targetStaffId,
              focusAreaId,
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: session.user.userId,
          action: 'STAFF_RESEARCH_GROUP_UPDATED',
          entityType: 'Staff',
          entityId: targetStaffId,
          snapshot: { researchGroupId, focusAreaIds: normalizedFocusAreaIds },
        },
      });
    });

    revalidatePath('/dashboard/profile/overview');
    revalidatePath(`/dashboard/admin/staff/${targetStaffId}/profile`);
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');

    return { success: true };
  } catch (error) {
    console.error('Failed to update research group membership:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
