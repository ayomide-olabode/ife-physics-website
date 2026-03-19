'use server';

import prisma from '@/lib/prisma';
import { requireAuth, requireResearchLeadForGroup } from '@/lib/guards';
import { isSuperAdmin } from '@/lib/rbac';
import { revalidatePath, revalidateTag } from 'next/cache';
import { isResearchOutputEligibleForGroup } from '@/server/queries/researchGroupOutputs';

export async function setFeaturedResearchOutput({
  groupId,
  outputId,
}: {
  groupId: string;
  outputId: string | null;
}) {
  try {
    const session = await requireAuth();

    if (!isSuperAdmin(session)) {
      await requireResearchLeadForGroup(session, groupId);
    }

    if (outputId) {
      const eligible = await isResearchOutputEligibleForGroup({ groupId, outputId });
      if (!eligible) {
        return { error: 'Selected research output is not eligible for this research group.' };
      }
    }

    await prisma.researchGroup.update({
      where: { id: groupId },
      data: { featuredResearchOutputId: outputId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.userId,
        action: outputId ? 'GROUP_FEATURED_OUTPUT_SET' : 'GROUP_FEATURED_OUTPUT_CLEARED',
        entityType: 'ResearchGroup',
        entityId: groupId,
        snapshot: { outputId },
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('public:research-groups');
    revalidatePath(`/dashboard/research/groups/${groupId}`);
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Set Featured Research Output Error:', error);
    return { error: 'Failed to update featured research output.' };
  }
}
