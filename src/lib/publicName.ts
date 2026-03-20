type PublicStaffNameInput = {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
};

export function getMiddleInitial(middleName?: string | null): string | null {
  const mn = (middleName ?? '').trim();
  if (!mn) return null;

  const firstChar = mn[0]?.toUpperCase();
  if (!firstChar) return null;

  if (mn.length === 1) return `${firstChar}.`;
  if (mn.length === 2 && mn.endsWith('.')) return `${firstChar}.`;
  return `${firstChar}.`;
}

export function formatPublicStaffName(input: PublicStaffNameInput): string {
  const fn = (input.firstName ?? '').trim();
  const ln = (input.lastName ?? '').trim();
  const middleInitial = getMiddleInitial(input.middleName);

  const formatted = middleInitial ? `${fn} ${middleInitial} ${ln}` : `${fn} ${ln}`;

  return formatted.replace(/\s+/g, ' ').trim();
}
