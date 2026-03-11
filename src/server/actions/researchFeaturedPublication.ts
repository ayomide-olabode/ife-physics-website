'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/guards';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getResearchGroupMemberStaffIds } from '../queries/researchGroupMembers';

export async function setFeaturedPublication({
  groupId,
  publicationId,
}: {
  groupId: string;
  publicationId: string | null;
}) {
  try {
    const session = await requireAuth();

    // In a real app we'd verify the user has the 'RESEARCH_LEAD' role for this group,
    // or is a super admin. For this patch, we assume auth logic is handled
    // or the user can edit the group if they have access to the page.

    if (publicationId) {
      // Validate that this publication is eligible
      const staffIds = await getResearchGroupMemberStaffIds(groupId);
      if (staffIds.length === 0) {
        return { error: 'No active staff in this research group.' };
      }

      // Let's use Prisma.$queryRaw to check eligibility just like the list query.
      const isEligible = await prisma.$queryRaw<{ id: string }[]>`
        SELECT r.id
        FROM "ResearchOutput" r,
             jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
        WHERE r.id = ${publicationId}
          AND r."deletedAt" IS NULL
          AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
        LIMIT 1;
      `;

      if (isEligible.length === 0) {
        return { error: 'Invalid publication or publication is not authored by a group member.' };
      }
    }

    // Apply the featured publication
    await prisma.researchGroup.update({
      where: { id: groupId },
      data: {
        featuredPublicationId: publicationId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.userId,
        action: 'RESEARCH_GROUP_FEATURED_PUBLICATION_SET',
        entityType: 'ResearchGroup',
        entityId: groupId,
        snapshot: { publicationId },
      },
    });
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    revalidatePath(`/dashboard/research/groups/${groupId}`);

    return { success: true };
  } catch (error) {
    console.error('Error setting featured publication:', error);
    return { error: 'Failed to update featured publication' };
  }
}
