import prisma from '@/lib/prisma';

export type AuditParams = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  snapshot: unknown;
};

/**
 * Insert an audit log entry into the AuditLog table.
 *
 * Usage example (inside a server action):
 *
 *   await logAudit({
 *     actorId: session.user.userId,
 *     action: 'UPDATE',
 *     entityType: 'Staff',
 *     entityId: staff.id,
 *     snapshot: { title: staff.title, name: staff.firstName },
 *   });
 */
export async function logAudit(params: AuditParams): Promise<void> {
  const { actorId, action, entityType, entityId, snapshot } = params;

  // Ensure snapshot is JSON-serializable by round-tripping through stringify/parse.
  let safeSnapshot: unknown;
  try {
    safeSnapshot = JSON.parse(JSON.stringify(snapshot));
  } catch {
    safeSnapshot = { _error: 'Snapshot was not JSON-serializable' };
  }

  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entityType,
      entityId,
      snapshot: safeSnapshot as Parameters<typeof prisma.auditLog.create>[0]['data']['snapshot'],
    },
  });
}
