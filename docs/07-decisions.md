# Decisions

Short records of choices that are easy to question later.

## 2026-11-22 - One repository, two deploy roots

The starter projects live in separate GitHub repositories. The product code now
lives here, in `frontend/` and `backend/`, with Vercel and Render pointed at
those subdirectories. One repository keeps the contract, migrations, and UI in
step, and avoids two histories drifting apart.

## 2026-11-22 - API path is `/api/v1`

The starter used `/api/auth/v1/...` and `/api/recipes/v1/...`. Mixing prefixes
made the contract hard to read. Everything is now `/api/v1/...`, including
auth. The old paths are retired.

## 2026-11-22 - Manila is a fixed offset

`Asia/Manila` is UTC+8 with no daylight saving. Time helpers use a fixed
`+08:00` offset rather than a timezone database. This is exact for the
Philippines and removes a dependency.

## 2026-11-22 - Buffers live in the appointment interval

`starts_at` and `ends_at` are the patient-facing slot. The database exclusion
constraint expands that range by the buffer columns when checking overlap, so
buffers protect the calendar without changing what the patient sees.

## 2026-11-22 - Same-origin cookies

The browser talks to Vercel only. Next rewrites `/api` to Render. Cookies are
host-only and `SameSite=Lax`. No `SameSite=None` cross-site setup.

## 2026-11-22 - Guest access is a cookie, not an account

A guest token is exchanged once for a short-lived, appointment-scoped HttpOnly
cookie. It never becomes a login session and never reaches another appointment.

## 2026-11-22 - Payments are records, not gateways

There is no online payment integration. Staff record cash, terminal, transfer,
or e-wallet payments received at the clinic. Corrections are reversal rows.

## 2026-11-22 - Pending requests never hold a slot

Approval is the only operation that occupies a doctor's calendar. It runs in a
transaction with row locks and an exclusion constraint as the final defense.
