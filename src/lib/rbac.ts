import prisma from '@/lib/prisma';
import { ScopedRole, ScopeType } from '.prisma/client';
import { Session } from 'next-auth';

export type Role = ScopedRole;

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.isSuperAdmin === true;
}

export async function hasGlobalRole(session: Session | null, role: ScopedRole): Promise<boolean> {
  if (!session?.user?.userId) return false;
  if (isSuperAdmin(session)) return true;

  const now = new Date();

  const assignment = await prisma.roleAssignment.findFirst({
    where: {
      userId: session.user.userId,
      role: role,
      scopeType: ScopeType.GLOBAL,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });

  return !!assignment;
}

export async function getScopedResearchGroupIds(session: Session | null): Promise<string[]> {
  if (!session?.user?.userId) return [];

  const now = new Date();

  const assignments = await prisma.roleAssignment.findMany({
    where: {
      userId: session.user.userId,
      role: ScopedRole.RESEARCH_LEAD,
      scopeType: ScopeType.RESEARCH_GROUP,
      scopeId: { not: null },
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { scopeId: true },
  });

  return assignments
    .map((a: { scopeId: string | null }) => a.scopeId)
    .filter((id): id is string => id !== null);
}

export async function isResearchLeadForGroup(
  session: Session | null,
  researchGroupId: string,
): Promise<boolean> {
  if (!session?.user?.userId) return false;
  if (isSuperAdmin(session)) return true;

  const now = new Date();

  const assignment = await prisma.roleAssignment.findFirst({
    where: {
      userId: session.user.userId,
      role: ScopedRole.RESEARCH_LEAD,
      scopeType: ScopeType.RESEARCH_GROUP,
      scopeId: researchGroupId,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });

  return !!assignment;
}

export function canEditStaff(session: Session | null, staffId: string): boolean {
  if (!session?.user) return false;
  return isSuperAdmin(session) || session.user.staffId === staffId;
}
