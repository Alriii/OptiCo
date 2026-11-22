# Security and privacy baseline

OptiCo stores patient identity and appointment data. That is sensitive personal
information under the Philippine Data Privacy Act of 2012. These controls are
the engineering baseline, not legal sign-off.

## Access

- Four roles: `PATIENT`, `DOCTOR`, `RECEPTIONIST`, `ADMIN`.
- Public signup creates `PATIENT` only.
- Staff accounts exist only through an admin invitation.
- Every route checks a permission, not just a role string.
- Ownership is derived from the session, never from the request body.
- Disabled accounts fail authentication and authorization immediately.
- Doctor access is limited to assigned appointments.

## Sessions

- bcrypt password hashes with a reviewed cost.
- 15 minute access JWT, 7 day rotating refresh token.
- Refresh tokens stored as SHA-256 hashes.
- Reuse of a consumed refresh token is rejected.
- Cookies: `HttpOnly`, `Secure` in production, `SameSite=Lax`, path `/`, no
  domain attribute.
- No tokens or patient data in `localStorage` or `sessionStorage`.
- Logout revokes the refresh token and clears all auth and CSRF cookies.

## Request protection

- CSRF double-submit token required for cookie-authenticated mutations.
- CORS allowlist with credentials, never `*`.
- Rate limits on login, signup, refresh, CSRF issuance, public booking, guest
  exchange, availability, and email-triggering endpoints.
- Zod validation at the HTTP boundary, with unknown keys stripped.
- Helmet security headers, HPP, request body size limits.

## Guest access

- 32 byte random token, base64url encoded.
- Only the SHA-256 hash is stored.
- Expiry from clinic settings, 7 days by default.
- Single use for exchange, revocable.
- Exchange returns an appointment-scoped HttpOnly cookie, not an account.
- The token is read from the URL fragment and removed immediately.
- No search by email or reference alone.

## Data handling

- No diagnoses, prescriptions, visual acuity, images, or clinical notes.
- Booking note is operational only and carries a warning in the UI.
- Payment records store amount, method, receipt reference, staff, and time. No
  card numbers, CVV, or banking credentials.
- Audit logs are append-only from the application. There is no delete route.
- Logs redact authorization headers, cookies, passwords, tokens, and database
  URLs.
- Patient DOB is never written to audit metadata or logs.

## Retention and legal

Before real patient data is entered, the clinic must confirm:

- lawful basis and privacy notice
- guardian and minor consent process
- retention and deletion rules
- processor agreements for Neon, Render, Vercel, and the email provider
- data subject request handling
- breach response and DPO registration where required

Use sample data only until that review is signed off.

## Known gaps at pilot stage

- Backup and restore must be exercised on a non-production branch.
- SMTP sender reputation and DMARC must be verified.
- Dependency audit should run on a schedule.
- A content security policy for the frontend should be added once third-party
  resources are finalized.
