'use server';

import prisma from '@/lib/prisma';
import { LeadershipRole, ProgrammeCode } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function createLeadershipTerm(params: {
  staffId: string;
  role: LeadershipRole;
  startDate: Date;
  endDate?: Date | null;
  programmeCode?: ProgrammeCode | null;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId || !session.user.isSuperAdmin) {
    return { error: 'Unauthorized.' };
  }

  const { staffId, role, startDate, endDate, programmeCode } = params;

  // Validate Staff exists
  const targetStaff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!targetStaff) {
    return { error: 'Staff member not found.' };
  }

  if (endDate && new Date(startDate) > new Date(endDate)) {
    return { error: 'Start date cannot be after end date.' };
  }

  // If role == HOD, enforce single active HOD
  if (role === 'HOD') {
    if (!endDate) {
      // Ensure no other HOD term has endDate null
      const activeHod = await prisma.leadershipTerm.findFirst({
        where: { role: 'HOD', endDate: null },
      });
      if (activeHod) {
        return {
          error:
            'There is already an active HOD. End the current term before starting a new ongoing term.',
        };
      }
    }
  }

  try {
    const term = await prisma.leadershipTerm.create({
      data: {
        staffId,
        role,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        programmeCode: programmeCode ?? null,
      },
    });

    const snapshot = JSON.parse(JSON.stringify(term));

    await logAudit({
      actorId: session.user.userId,
      action: 'LEADERSHIP_TERM_CREATED',
      entityType: 'LeadershipTerm',
      entityId: term.id,
      snapshot,
    });

    return { success: true, term };
  } catch (error) {
    console.error('Error creating leadership term:', error);
    return { error: 'Failed to create leadership term.' };
  }
}

export async function endLeadershipTerm({ termId, endDate }: { termId: string; endDate: Date }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId || !session.user.isSuperAdmin) {
    return { error: 'Unauthorized.' };
  }

  const existingTerm = await prisma.leadershipTerm.findUnique({
    where: { id: termId },
  });

  if (!existingTerm) {
    return { error: 'Leadership term not found.' };
  }

  if (new Date(endDate) < new Date(existingTerm.startDate)) {
    return { error: 'End date cannot be before the start date of the term.' };
  }

  try {
    const updated = await prisma.leadershipTerm.update({
      where: { id: termId },
      data: { endDate: new Date(endDate) },
    });

    const snapshot = JSON.parse(JSON.stringify(updated));

    await logAudit({
      actorId: session.user.userId,
      action: 'LEADERSHIP_TERM_ENDED',
      entityType: 'LeadershipTerm',
      entityId: updated.id,
      snapshot,
    });

    return { success: true, term: updated };
  } catch (error) {
    console.error('Error ending leadership term:', error);
    return { error: 'Failed to end leadership term.' };
  }
}
