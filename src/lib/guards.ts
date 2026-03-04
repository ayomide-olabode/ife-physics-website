import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  isSuperAdmin,
  hasGlobalRole,
  isResearchLeadForGroup,
  getScopedResearchGroupIds,
  canEditStaff,
} from '@/lib/rbac';
import { ScopedRole } from '.prisma/client';
import { Session } from 'next-auth';

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireSuperAdmin(session: Session) {
  if (!isSuperAdmin(session)) {
    notFound();
  }
}

export async function requireGlobalRole(session: Session, role: ScopedRole) {
  const hasRole = await hasGlobalRole(session, role);
  if (!hasRole) {
    notFound();
  }
}

export async function requireResearchLeadForGroup(session: Session, groupId: string) {
  const isLead = await isResearchLeadForGroup(session, groupId);
  if (!isLead) {
    notFound();
  }
}

export async function requireAnyResearchLead(session: Session) {
  if (isSuperAdmin(session)) return;
  const groupIds = await getScopedResearchGroupIds(session);
  if (groupIds.length === 0) {
    notFound();
  }
}

export function requireStaffOwnership(session: Session, staffId: string) {
  if (!canEditStaff(session, staffId)) {
    notFound();
  }
}
