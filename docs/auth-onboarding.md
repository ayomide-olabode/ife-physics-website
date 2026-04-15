# Auth Onboarding and Password Reset

## Email Delivery

- Development: if SMTP is not configured, email links are logged by the server mailer fallback (`src/lib/mailer.ts`).
- Production: SMTP must be configured. If SMTP is missing or sending fails:
  - Registration now returns an error to the user.
  - Created invite/reset tokens are cleaned up to avoid resend-throttle lockouts.

Required SMTP env vars:

- `SMTP_HOST`
- `SMTP_PORT` (e.g. `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (sender address, e.g. `noreply@your-domain.com`)
- `SMTP_SECURE` (`true` for implicit TLS/465, otherwise `false`)

## APP_URL

- Set `APP_URL` in your environment to the public base URL used to build invite/reset links.
- Example:
  - local: `APP_URL=http://localhost:3000`
  - production: `APP_URL=https://physics.ife.edu.ng`

## Token Rules

- Invite link token (`INVITE`) expires after 60 minutes.
- Password reset token (`PASSWORD_RESET`) expires after 30 minutes.
- Resend throttling: a new email for the same token context can only be sent after 5 minutes.

## Deployment Note (Server Actions)

- If users see `Failed to find Server Action ... older or newer deployment`, it indicates a stale page/client bundle vs current deployment.
- Auth flows now auto-refresh once when this is detected.
- Operationally, prefer atomic deploys (avoid mixed old/new app versions behind the same load balancer).
