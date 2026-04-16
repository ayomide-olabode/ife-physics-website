'use server';

import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/guards';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { StaffType, StaffStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createStaff({
  institutionalEmail,
  firstName,
  middleName,
  lastName,
  staffType,
}: {
  institutionalEmail: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  staffType: StaffType;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);
  const adminUserId = session.user.userId;

  const emailLower = institutionalEmail.toLowerCase().trim();
  const normalizedFirstName = firstName.trim();
  const normalizedMiddleName = middleName?.trim() || null;
  const normalizedLastName = lastName.trim();

  if (!normalizedFirstName) {
    throw new Error('First name is required.');
  }

  if (!normalizedLastName) {
    throw new Error('Last name is required.');
  }

  // Validate unique email
  const existingStaff = await prisma.staff.findUnique({
    where: { institutionalEmail: emailLower },
  });

  if (existingStaff) {
    throw new Error('A staff member with this institutional email already exists.');
  }

  const result = await prisma.staff.create({
    data: {
      institutionalEmail: emailLower,
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      staffType,
      staffStatus: StaffStatus.ACTIVE,
    },
    select: {
      id: true,
      institutionalEmail: true,
      firstName: true,
      middleName: true,
      lastName: true,
      staffType: true,
      staffStatus: true,
    },
  });

  await logAudit({
    actorId: adminUserId,
    action: 'STAFF_CREATED',
    entityType: 'Staff',
    entityId: result.id,
    snapshot: {
      email: result.institutionalEmail,
      firstName: result.firstName,
      middleName: result.middleName,
      lastName: result.lastName,
      type: result.staffType,
      status: result.staffStatus,
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath(`/dashboard/admin/staff/${result.id}`);

  return {
    staffId: result.id,
    institutionalEmail: result.institutionalEmail,
    staffType: result.staffType,
    staffStatus: result.staffStatus,
  };
}

export async function updateStaffStatus({
  staffId,
  staffStatus,
}: {
  staffId: string;
  staffStatus: StaffStatus;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, staffStatus: true, isInMemoriam: true },
  });

  if (!existing) {
    throw new Error('Staff record not found.');
  }

  if (existing.staffStatus === staffStatus) {
    return { success: true, unchanged: true };
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      staffStatus,
      isInMemoriam: staffStatus === StaffStatus.IN_MEMORIAM,
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'STAFF_STATUS_UPDATED',
    entityType: 'Staff',
    entityId: staffId,
    snapshot: {
      before: {
        staffStatus: existing.staffStatus,
        isInMemoriam: existing.isInMemoriam,
      },
      after: {
        staffStatus,
        isInMemoriam: staffStatus === StaffStatus.IN_MEMORIAM,
      },
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath(`/dashboard/admin/staff/${staffId}`);
  revalidatePath('/people');

  return { success: true, unchanged: false };
}

export async function updateStaffPublicVisibility({
  staffId,
  isPublicProfile,
}: {
  staffId: string;
  isPublicProfile: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, isPublicProfile: true },
  });

  if (!existing) {
    throw new Error('Staff record not found.');
  }

  if (existing.isPublicProfile === isPublicProfile) {
    return { success: true, unchanged: true };
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: { isPublicProfile },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'STAFF_PUBLIC_VISIBILITY_UPDATED',
    entityType: 'Staff',
    entityId: staffId,
    snapshot: {
      before: { isPublicProfile: existing.isPublicProfile },
      after: { isPublicProfile },
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath(`/dashboard/admin/staff/${staffId}`);
  revalidatePath('/people');
  revalidatePath('/about/leadership');
  revalidatePath('/research');

  return { success: true, unchanged: false };
}

export async function deleteStaff({ staffId }: { staffId: string }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);

  if (session.user.staffId === staffId) {
    throw new Error('You cannot delete your own staff record.');
  }

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      institutionalEmail: true,
      user: {
        select: { id: true },
      },
    },
  });

  if (!existing) {
    throw new Error('Staff record not found.');
  }

  await prisma.staff.delete({
    where: { id: staffId },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'STAFF_DELETED',
    entityType: 'Staff',
    entityId: staffId,
    snapshot: {
      email: existing.institutionalEmail,
      hadUserAccount: Boolean(existing.user),
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath('/dashboard/admin/users');
  revalidatePath('/people');

  return { success: true };
}
