'use server';

import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/guards';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { StaffType, StaffStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requestRegistrationLink } from '@/server/actions/onboardingRegister';

export async function createStaff({
  institutionalEmail,
  staffType,
  staffStatus,
  designation,
  academicRank,
  isSuperAdminShell = false,
}: {
  institutionalEmail: string;
  staffType: StaffType;
  staffStatus: StaffStatus;
  designation?: string;
  academicRank?: string;
  isSuperAdminShell?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);
  const adminUserId = session.user.userId;

  const emailLower = institutionalEmail.toLowerCase().trim();

  // Validate unique email
  const existingStaff = await prisma.staff.findUnique({
    where: { institutionalEmail: emailLower },
  });

  if (existingStaff) {
    throw new Error('A staff member with this institutional email already exists.');
  }

  // Transaction
  const result = await prisma.$transaction(async (tx) => {
    const newStaff = await tx.staff.create({
      data: {
        institutionalEmail: emailLower,
        staffType,
        staffStatus,
        designation: designation?.trim() || null,
        academicRank: academicRank?.trim() || null,
      },
    });

    // Ensure a shell user always exists for onboarding.
    const existingUser = await tx.user.findUnique({
      where: { staffId: newStaff.id },
    });

    const newUser =
      existingUser ??
      (await tx.user.create({
        data: {
          staffId: newStaff.id,
          passwordHash: '',
          isSuperAdmin: isSuperAdminShell,
        },
      }));

    return {
      staffId: newStaff.id,
      userId: newUser?.id,
      institutionalEmail: newStaff.institutionalEmail,
      staffType: newStaff.staffType,
      staffStatus: newStaff.staffStatus,
      isSuperAdmin: newUser?.isSuperAdmin,
    };
  });

  await logAudit({
    actorId: adminUserId,
    action: 'STAFF_CREATED',
    entityType: 'Staff',
    entityId: result.staffId,
    snapshot: {
      email: result.institutionalEmail,
      type: result.staffType,
      status: result.staffStatus,
    },
  });

  if (result.userId) {
    await logAudit({
      actorId: adminUserId,
      action: 'USER_SHELL_CREATED',
      entityType: 'User',
      entityId: result.userId,
      snapshot: {
        staffId: result.staffId,
        isSuperAdmin: result.isSuperAdmin,
      },
    });
  }

  revalidatePath('/dashboard/admin/staff');
  revalidatePath('/dashboard/admin/users');

  const inviteResult = await requestRegistrationLink(result.institutionalEmail);

  return {
    ...result,
    inviteStatus: inviteResult.success ? inviteResult.status : 'NO_STAFF',
    inviteMinutesRemaining: inviteResult.success ? inviteResult.minutesRemaining : undefined,
    inviteError: inviteResult.success ? undefined : inviteResult.error,
  };
}
