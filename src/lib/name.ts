/**
 * Utility for formatting names cleanly without double spaces.
 */
export function formatFullName({
  firstName,
  middleName,
  lastName,
}: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  return [firstName, middleName, lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .trim();
}

export const formatPersonName = formatFullName;
