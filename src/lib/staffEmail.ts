const NO_EMAIL_DOMAIN = 'no-email.invalid';

export function generateNoEmailPlaceholder(): string {
  return `memorial+${crypto.randomUUID()}@${NO_EMAIL_DOMAIN}`;
}

export function isNoEmailPlaceholder(email: string): boolean {
  return email.toLowerCase().endsWith(`@${NO_EMAIL_DOMAIN}`);
}

export function hasDeliverableStaffEmail(email: string): boolean {
  return !isNoEmailPlaceholder(email);
}

export function displayStaffEmail(email: string): string {
  return isNoEmailPlaceholder(email) ? 'No email provided' : email;
}
