'use server';

import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/guards';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { StaffType, StaffStatus } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { generateNoEmailPlaceholder, isNoEmailPlaceholder } from '@/lib/staffEmail';

export async function createStaff({
  institutionalEmail,
  firstName,
  middleName,
  lastName,
  staffType,
}: {
  institutionalEmail?: string;
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

  const rawEmail = institutionalEmail?.trim() ?? '';
  const normalizedFirstName = firstName.trim();
  const normalizedMiddleName = middleName?.trim() || null;
  const normalizedLastName = lastName.trim();
  const emailLower = rawEmail ? rawEmail.toLowerCase() : generateNoEmailPlaceholder();

  if (!normalizedFirstName) {
    throw new Error('First name is required.');
  }

  if (!normalizedLastName) {
    throw new Error('Last name is required.');
  }

  if (rawEmail) {
    const parsedEmail = z.string().email().safeParse(rawEmail);
    if (!parsedEmail.success) {
      throw new Error('Please provide a valid email address or leave it blank.');
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { institutionalEmail: emailLower },
    });

    if (existingStaff) {
      throw new Error('A staff member with this email already exists.');
    }
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
      email: isNoEmailPlaceholder(result.institutionalEmail) ? null : result.institutionalEmail,
      firstName: result.firstName,
      middleName: result.middleName,
      lastName: result.lastName,
      type: result.staffType,
      status: result.staffStatus,
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath(`/dashboard/admin/staff/${result.id}`);
  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('public:staff-slug-index');
  revalidatePath('/people');

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
  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('public:staff-slug-index');

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
  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('public:staff-slug-index');

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
  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('public:staff-slug-index');

  return { success: true };
}
