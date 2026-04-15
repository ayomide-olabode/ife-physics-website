const STALE_SERVER_ACTION_PATTERNS = [
  /failed to find server action/i,
  /older or newer deployment/i,
  /failed-to-find-server-action/i,
];

const RECOVERY_SESSION_KEY = '__server_action_refresh_ts';
const RECOVERY_COOLDOWN_MS = 15_000;

function toErrorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack ?? ''}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isStaleServerActionError(error: unknown): boolean {
  const text = toErrorText(error);
  return STALE_SERVER_ACTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function recoverFromStaleServerActionError(error: unknown): boolean {
  if (typeof window === 'undefined') return false;
  if (!isStaleServerActionError(error)) return false;

  const now = Date.now();
  const lastAttemptRaw = window.sessionStorage.getItem(RECOVERY_SESSION_KEY);
  const lastAttempt = lastAttemptRaw ? Number(lastAttemptRaw) : 0;

  if (Number.isFinite(lastAttempt) && now - lastAttempt < RECOVERY_COOLDOWN_MS) {
    return false;
  }

  window.sessionStorage.setItem(RECOVERY_SESSION_KEY, String(now));
  window.location.reload();
  return true;
}
