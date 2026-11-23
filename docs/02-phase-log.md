# Phase log

Short entries only. One block per checkpoint.

## 2026-11-22 - Phase 0 complete

Inspected starter repositories (`portfolio-frontend-itelect2` and `appsdev-api-tutorial`), mapped dependency graph, audited auth flow and routes, and established clean baseline. Documented findings in `docs/00-repository-audit.md`.

## 2026-11-22 - Phase 1 complete

- Environment variables standardized; `.env.example` created for frontend and backend.
- Boot secret validation added (`backend/src/config/env.ts`), blocking weak fallback secrets in production.
- Same-origin `/api/*` Next.js rewrite configured (`frontend/next.config.ts`) forwarding to `BACKEND_INTERNAL_URL`.
- Health and readiness endpoints implemented (`/api/v1/health/live` and `/api/v1/health/ready`).
- Express security middleware wired: Helmet, HPP, CORS allowlists, Rate Limiting, Request ID tracing, CSRF (`csrf-csrf`).
- Graceful shutdown for HTTP server, `pg.Pool`, and background workers.

## 2026-11-22 - Phase 2 complete

- Drizzle schema implemented in `backend/src/db/schema.ts` modeling the full OptiCo domain:
  `users`, `patients`, `doctors`, `services`, `doctor_services`, `clinic_hours`, `clinic_closures`, `doctor_weekly_availability`, `doctor_schedule_exceptions`, `appointments`, `appointment_status_history`, `walk_in_queue_entries`, `guest_booking_tokens`, `tokens`, `payments`, `email_outbox`, `audit_logs`, `clinic_settings`, `staff_invites`.
- Additive SQL migration generated (`backend/drizzle/0001_optico.sql`) including PostgreSQL `btree_gist` extension and the `appointments_no_doctor_overlap` exclusion constraint.

## 2026-11-22 - Phase 3 complete

- Unified API contract under `/api/v1/auth/session`.
- Public signup strictly creates `PATIENT` role; staff invites created by admin via `/api/v1/admin/staff/invite` and redeemed via `/api/v1/auth/accept-invite`.
- Refresh token rotation with SHA-256 token hashing, token family tracking, and reuse detection.
- Centralized permission engine (`backend/src/lib/permissions.ts`) granting granular permissions to `PATIENT`, `DOCTOR`, `RECEPTIONIST`, and `ADMIN`.
- Guest token hashing and appointment-scoped exchange.

## 2026-11-22 - Phase 4 complete

- Service catalog CRUD with configurable duration, buffer before/after, and numeric PHP fees.
- Clinic weekday operating hours (Mon-Fri 09:00-17:00 Asia/Manila default) and exception closures.
- Doctor weekly availability schedules and exception types (`UNAVAILABLE`, `ADDITIONAL`, `TIME_OFF`).
- Candidate slot availability calculation algorithm (`backend/src/services/scheduling-service.ts`) evaluating operating hours, doctor qualifications, breaks, and booked appointments.

## 2026-11-22 - Phase 5 complete

- Public and patient booking requests create `PENDING` non-blocking appointments; minor guardian validation enforced.
- Staff approval runs inside a PostgreSQL transaction (`FOR UPDATE` locks) with automatic fair doctor assignment and exclusion constraint violation (`23P01`) handling.
- Immutable status history transitions with actor and reason tracking.

## 2026-11-22 - Phase 6 complete

- Walk-in patient registration with immediate assignment or daily unique queue ticket allocation (`walkInQueueEntries`).
- Waiting queue lifecycle transitions (`WAITING`, `CALLED`, `IN_SERVICE`, `COMPLETED`, `NO_SHOW`, `CANCELLED`).
- In-clinic payment recording, balance calculation against snapshot fees, and auditable reversal entries (`reverses_payment_id`).

## 2026-11-22 - Phase 7 complete

- Database-backed transactional email outbox (`email_outbox`) with deduplication keys.
- Background polling worker (`email-worker.ts`) using `FOR UPDATE SKIP LOCKED` batch claiming with exponential backoff.
- Transactional templates: request received, staff pending alert, appointment approved/rejected/cancelled/rescheduled, 24h & 2h reminders, guest link, and staff invite.
- Cancellation and rescheduling automatically invalidate old unsent reminders.

## 2026-11-22 - Phase 8 complete

- Botanical Premium design system tokens applied across Tailwind 4, Radix components, custom UI primitives, and layout shells.

## 2026-11-22 - Phase 9 complete

- Implemented all 34 routes in Next.js 16 App Router across:
  - Public discovery: landing (`/`), services directory (`/services`), doctors directory (`/doctors`), doctor profile (`/doctors/[slug]`), booking flow (`/booking`), guest appointment management (`/guest/manage`), legal and clinic policy pages (`/policies/*`).
  - Auth: login (`/login`), patient registration (`/signup`), staff invitation acceptance (`/accept-invite`).
  - Role-gated portals: Patient portal (`/patient/*`), Doctor portal (`/doctor/*`), Staff/Receptionist portal (`/staff/*`), Admin management portal (`/admin/*`).
- Dynamic server-side API proxying configured in `next.config.ts` transparently forwarding `/api/*` to `BACKEND_INTERNAL_URL`.

## 2026-11-22 - Phase 10 complete

- End-to-end operational test suite (`backend/test/live-e2e-suite.ts`) executed against live running servers (`http://localhost:3001` Next.js frontend proxy and `http://localhost:7000` Express backend connected to Neon PostgreSQL).
- 28/28 live operational tests passed:
  1. Health & Discovery (Clinic profile, 5 Services, 2 Doctors, Doctor profile)
  2. Security & Auth across all 4 roles (Double-submit CSRF, Admin login + session, Doctor login, Patient login, Receptionist login)
  3. Scheduling Availability Engine (26 slots computed across schedules, lunch hours excluded, clinic operating hours enforced)
  4. Guest Booking Lifecycle (Minor validation + guardian contact, reference code generated, status initialized to PENDING)
  5. Guest Token Exchange (SHA-256 opaque token retrieved from outbox, exchanged for guest session cookie, guest view verified)
  6. Staff Clinical Workflow (Listing pending requests, staff approval -> CONFIRMED, check-in -> CHECKED_IN, in-clinic cash payment recorded -> ₱500, balance engine verified -> paid / zero balance, completion -> COMPLETED)
  7. Walk-in Queue Lifecycle (Walk-in queued with sequential ticket, called -> CALLED, consultation started -> IN_SERVICE, session completed -> COMPLETED)
  8. Transactional Email Outbox & Audit Trail (Notifications queued in PostgreSQL `email_outbox` table, appointment status and audit logs verified in DB)
- Test and build suite 100% clean:
  - Backend Vitest: 6 suites, 31/31 passed.
  - Frontend Vitest: 5 suites, 9/9 passed.
  - Backend ESLint: 0 errors, 0 warnings.
  - Frontend ESLint: 0 errors, 0 warnings.
  - TypeScript `tsc --noEmit`: 0 errors across backend and frontend.
  - Overall `verify.ps1 -SkipInstall`: All checks passed.
- Public site: Home showcase, Services directory, Doctors directory & profile, Booking flow with guest and account options, guest management route, policy and contact pages.
- Four distinct role portals: Patient, Doctor, Staff/Receptionist, and Admin.
- Full quality check pass: Vitest suites on backend (31 tests) and frontend (9 tests) pass cleanly; Next.js 16 build succeeds with all 34 routes prerendered / dynamic.

## 2026-11-23 - Vite migration follow-up

- Frontend now builds with Vite 8 and React Router; `next/link` and `next/navigation` resolve to shims in `frontend/lib/`, so the existing `app/` pages stay in place.
- Aligned frontend payloads with the API schemas: guest booking and walk-ins nest patient details, admin services use `isActive`, admin doctors use `displayName`/`isActive`/`serviceIds`, and payments use the `EWALLET` enum value.
- Doctor types now follow the API (`displayName`, `isActive`, `serviceIds`), which fixes blank names in the public directory, profile, home showcase, and admin lists.
- Patient profile reads unwrap the `{ patient }` envelope, so booking prefill and the profile page load correctly.
- Added `frontend/vercel.json` with the `/api` rewrite to Render and the SPA fallback. Local ports documented as Vite 3001 / Express 7000.
- Verified with a live contract smoke test against the seeded database: 11/11 checks passed for guest booking, walk-in, admin service and doctor writes, doctor create, and e-wallet payment.
