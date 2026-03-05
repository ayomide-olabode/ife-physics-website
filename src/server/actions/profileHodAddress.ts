'use server';

import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const hodAddressSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(120, 'Title cannot exceed 120 characters.'),
  body: z.string().min(1, 'Body is required.').max(4000, 'Body cannot exceed 4000 characters.'),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export async function updateMyHodAddress(
  data: z.infer<typeof hodAddressSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = hodAddressSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    // Must be the owner to edit their own profile block
    await requireStaffOwnership(session, staffId);

    // Enforce active HOD authorization strictly
    const activeTerm = await prisma.leadershipTerm.findFirst({
      where: {
        staffId,
        role: 'HOD',
        endDate: null,
      },
      select: { id: true },
    });

    if (!activeTerm) {
      return {
        success: false,
        error: 'Unauthorized: You are not currently marked as an active HOD.',
      };
    }

    const updatedDoc = await prisma.hodAddress.upsert({
      where: { staffId },
      create: {
        staffId,
        title: validated.title,
        body: validated.body,
      },
      update: {
        title: validated.title,
        body: validated.body,
      },
      select: { id: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'HOD_ADDRESS_UPDATED',
      entityType: 'HodAddress',
      entityId: updatedDoc.id,
      snapshot: {
        staffId,
        termId: activeTerm.id,
        title: validated.title,
      },
    });

    revalidatePath('/dashboard/profile/hod-address');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update HOD address:', error);
    return { success: false, error: 'Database mutation failed securely.' };
  }
}
