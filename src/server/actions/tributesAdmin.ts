'use server';

import prisma from '@/lib/prisma';
import { requireTributesAccess } from '@/lib/guards';
import { revalidatePath } from 'next/cache';
import { StaffStatus } from '@prisma/client';

type MarkInMemoriamParams = {
  staffId: string;
  dateOfBirth?: string;
  dateOfDeath: string;
};

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export async function markStaffInMemoriam({
  staffId,
  dateOfBirth,
  dateOfDeath,
}: MarkInMemoriamParams) {
  const session = await requireTributesAccess();

  if (!staffId) {
    return { error: 'Staff is required.' };
  }

  if (!dateOfDeath) {
    return { error: 'Date of death is required.' };
  }

  const parsedDateOfDeath = parseDateInput(dateOfDeath);
  if (!parsedDateOfDeath) {
    return { error: 'Date of death is invalid.' };
  }

  const today = startOfUtcDay(new Date());
  if (parsedDateOfDeath > today) {
    return { error: 'Date of death cannot be in the future.' };
  }

  const parsedDateOfBirth = dateOfBirth ? parseDateInput(dateOfBirth) : null;
  if (dateOfBirth && !parsedDateOfBirth) {
    return { error: 'Date of birth is invalid.' };
  }

  if (parsedDateOfBirth && parsedDateOfBirth >= parsedDateOfDeath) {
    return { error: 'Date of birth must be before date of death.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.findUnique({
        where: { id: staffId },
        select: { id: true, dateOfBirth: true },
      });

      if (!staff) {
        throw new Error('Staff member not found.');
      }

      await tx.staff.update({
        where: { id: staffId },
        data: {
          isInMemoriam: true,
          dateOfBirth: parsedDateOfBirth ?? staff.dateOfBirth,
          dateOfDeath: parsedDateOfDeath,
          staffStatus: StaffStatus.IN_MEMORIAM,
        },
      });

      const user = await tx.user.findUnique({
        where: { staffId },
        select: { id: true },
      });

      let rolesEndedCount = 0;
      if (user) {
        const revokedRoles = await tx.roleAssignment.updateMany({
          where: {
            userId: user.id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        await tx.roleAssignment.updateMany({
          where: {
            userId: user.id,
            OR: [{ expiresAt: null }, { expiresAt: { gt: parsedDateOfDeath } }],
          },
          data: {
            expiresAt: parsedDateOfDeath,
          },
        });
        rolesEndedCount = revokedRoles.count;
      }

      const termsUpdate = await tx.leadershipTerm.updateMany({
        where: {
          staffId,
          OR: [{ endDate: null }, { endDate: { gt: parsedDateOfDeath } }],
        },
        data: { endDate: parsedDateOfDeath },
      });
      const termsEndedCount = termsUpdate.count;

      await tx.auditLog.create({
        data: {
          actorId: session.user.userId ?? null,
          action: 'STAFF_MARKED_IN_MEMORIAM',
          entityType: 'Staff',
          entityId: staffId,
          snapshot: {
            staffId,
            dateOfDeath: parsedDateOfDeath.toISOString(),
            rolesEndedCount,
            termsEndedCount,
          },
        },
      });

      return { rolesEndedCount, termsEndedCount };
    });

    revalidatePath('/dashboard/content/tributes');
    revalidatePath(`/dashboard/content/tributes/${staffId}`);

    return { success: true, staffId, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark staff in memoriam.';
    return { error: message };
  }
}
