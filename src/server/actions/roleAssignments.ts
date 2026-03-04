'use server';

import prisma from '@/lib/prisma';
import { ScopedRole, ScopeType } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function assignRole(params: {
  userId: string;
  role: ScopedRole;
  scopeId?: string | null;
  expiresAt?: Date | null;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId || !session.user.isSuperAdmin) {
    return { error: 'Unauthorized.' };
  }

  const { userId, role, scopeId, expiresAt } = params;

  // Validate user exists
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { error: 'User not found.' };
  }

  let scopeType: ScopeType;
  let finalScopeId: string | null = null;

  if (role === 'EDITOR' || role === 'ACADEMIC_COORDINATOR') {
    scopeType = 'GLOBAL';
  } else if (role === 'RESEARCH_LEAD') {
    scopeType = 'RESEARCH_GROUP';
    if (!scopeId) {
      return { error: 'RESEARCH_LEAD requires a scopeId (Research Group).' };
    }

    // Verify ResearchGroup exists
    const group = await prisma.researchGroup.findUnique({ where: { id: scopeId } });
    if (!group) {
      return { error: 'Specified Research Group does not exist.' };
    }
    finalScopeId = scopeId;

    // Enforce max 2 active RESEARCH_LEAD per group
    const activeLeadsCount = await prisma.roleAssignment.count({
      where: {
        role: 'RESEARCH_LEAD',
        scopeType: 'RESEARCH_GROUP',
        scopeId: finalScopeId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (activeLeadsCount >= 2) {
      return { error: 'Maximum of 2 active Research Leads allowed per group.' };
    }
  } else {
    return { error: 'Invalid role specified.' };
  }

  try {
    const assignment = await prisma.roleAssignment.create({
      data: {
        userId,
        role,
        scopeType,
        scopeId: finalScopeId,
        expiresAt: expiresAt ?? null,
      },
    });

    const snapshot = JSON.parse(JSON.stringify(assignment));

    await logAudit({
      actorId: session.user.userId,
      action: 'ROLE_ASSIGNED',
      entityType: 'RoleAssignment',
      entityId: assignment.id,
      snapshot,
    });

    return { success: true, roleAssignment: assignment };
  } catch (error: unknown) {
    // Check for unique constraint violation
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { error: 'User already has this role for the specified scope.' };
    }
    console.error('Error assigning role:', error);
    return { error: 'Failed to assign role.' };
  }
}

export async function revokeRole({ roleAssignmentId }: { roleAssignmentId: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId || !session.user.isSuperAdmin) {
    return { error: 'Unauthorized.' };
  }

  const existing = await prisma.roleAssignment.findUnique({
    where: { id: roleAssignmentId },
  });

  if (!existing) {
    return { error: 'Role assignment not found.' };
  }

  if (existing.deletedAt) {
    return { error: 'Role assignment is already revoked.' };
  }

  try {
    const updated = await prisma.roleAssignment.update({
      where: { id: roleAssignmentId },
      data: { deletedAt: new Date() },
    });

    const snapshot = JSON.parse(JSON.stringify(updated));

    await logAudit({
      actorId: session.user.userId,
      action: 'ROLE_REVOKED',
      entityType: 'RoleAssignment',
      entityId: updated.id,
      snapshot,
    });

    return { success: true, roleAssignment: updated };
  } catch (error) {
    console.error('Error revoking role:', error);
    return { error: 'Failed to revoke role.' };
  }
}
