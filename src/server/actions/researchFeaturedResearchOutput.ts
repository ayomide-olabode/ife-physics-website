'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth, requireResearchLeadForGroup } from '@/lib/guards';
import { isSuperAdmin } from '@/lib/rbac';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getResearchGroupMemberStaffIds } from '../queries/researchGroupMembers';

export async function setFeaturedResearchOutput({
  groupId,
  researchOutputId,
}: {
  groupId: string;
  researchOutputId: string | null;
}) {
  try {
    const session = await requireAuth();

    if (!isSuperAdmin(session)) {
      await requireResearchLeadForGroup(session, groupId);
    }

    if (researchOutputId) {
      // Validate that this research output is eligible
      const staffIds = await getResearchGroupMemberStaffIds(groupId);
      if (staffIds.length === 0) {
        return { error: 'No active staff in this research group.' };
      }

      // Let's use Prisma.$queryRaw to check eligibility just like the list query.
      const isEligible = await prisma.$queryRaw<{ id: string }[]>`
        SELECT r.id
        FROM "ResearchOutput" r,
             jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
        WHERE r.id = ${researchOutputId}
          AND r."deletedAt" IS NULL
          AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
        LIMIT 1;
      `;

      if (isEligible.length === 0) {
        return {
          error: 'Invalid research output or research output is not authored by a group member.',
        };
      }
    }

    // Apply the featured research output
    await prisma.researchGroup.update({
      where: { id: groupId },
      data: {
        featuredResearchOutputId: researchOutputId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.userId,
        action: 'RESEARCH_GROUP_FEATURED_RESEARCH_OUTPUT_SET',
        entityType: 'ResearchGroup',
        entityId: groupId,
        snapshot: { researchOutputId: researchOutputId },
      },
    });
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    revalidatePath(`/dashboard/research/groups/${groupId}`);

    return { success: true };
  } catch (error) {
    console.error('Error setting featured research output:', error);
    return { error: 'Failed to update featured research output' };
  }
}
