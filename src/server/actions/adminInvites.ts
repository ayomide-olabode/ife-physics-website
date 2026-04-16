'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireSuperAdmin } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { requestRegistrationLink } from '@/server/actions/onboardingRegister';
import { hasDeliverableStaffEmail } from '@/lib/staffEmail';

type InviteStatus = 'SENT' | 'THROTTLED' | 'ALREADY_ACTIVE' | 'NO_STAFF';

export async function sendInviteForStaff(
  staffId: string,
): Promise<
  | { success: true; status: InviteStatus; minutesRemaining?: number }
  | { success: false; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  await requireSuperAdmin(session);

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      institutionalEmail: true,
      user: {
        select: {
          passwordHash: true,
        },
      },
    },
  });

  if (!staff) {
    return { success: true, status: 'NO_STAFF' };
  }

  if (staff.user?.passwordHash && staff.user.passwordHash !== '') {
    return { success: true, status: 'ALREADY_ACTIVE' };
  }

  if (!hasDeliverableStaffEmail(staff.institutionalEmail)) {
    return {
      success: false,
      error: 'This staff profile has no deliverable email address for invitations.',
    };
  }

  const result = await requestRegistrationLink(staff.institutionalEmail);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    status: result.status,
    minutesRemaining: result.minutesRemaining,
  };
}
