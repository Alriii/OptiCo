# Readiness checklist

Each row is a spec area, not a feature wishlist. Status values:

- `done` - exists and matches the spec
- `partial` - exists but needs external configuration / live credentials
- `missing` - not present
- `n/a` - starter content, removed

## Foundations

| Area | Frontend | Backend | Notes |
|---|---|---|---|
| Framework version | done | done | Next 16.1.4 (Turbopack) / Express 5.2.1 |
| Language and types | done | done | TypeScript strict on both repos |
| UI system | done | n/a | Botanical Premium design tokens + Radix/Tailwind 4 |
| Env example | done | done | `.env.example` in both `frontend/` and `backend/` |
| Secret validation at boot | n/a | done | Fails boot on missing secrets or JWT/CSRF collision |
| API rewrite (same origin) | done | n/a | `next.config.ts` rewrites `/api/*` to `BACKEND_INTERNAL_URL` |
| Health and readiness | n/a | done | `/api/v1/health/live` and `/api/v1/health/ready` (DB probe) |
| Graceful shutdown | n/a | done | SIGTERM/SIGINT drains pool, stops worker, closes server |
| Request IDs and logging | done | done | `x-request-id` header tracing & structured JSON logging |
| Rate limiting | n/a | done | Strict auth, booking, and public route limits |
| Test runner | done | done | Vitest configured on both backend and frontend |
| Lint, typecheck, build | done | done | Clean pass on `verify.ps1` |

## Identity and access

| Area | Frontend | Backend | Notes |
|---|---|---|---|
| Login form | done | done | HttpOnly JWT session cookies |
| Signup form | done | done | Strictly creates PATIENT accounts |
| CSRF exchange | done | done | `csrf-csrf` double-submit token cookie & header |
| Session endpoint contract | done | done | Unified on `/api/v1/auth/session` |
| Refresh rotation | done | done | Hashed refresh tokens, family tracking, reuse detection |
| Logout | done | done | Revokes tokens and clears auth cookies |
| Role model | done | done | PATIENT, DOCTOR, RECEPTIONIST, ADMIN |
| Staff invitation | done | done | Admin invites staff; `/accept-invite` onboarding |
| Account status / disable | done | done | Disabled staff immediately denied access |
| Guest link exchange | done | done | One-time token hash exchange, scoped to appointment |

## Clinic domain

| Area | State | Notes |
|---|---|---|
| Services and fees | done | Admin CRUD, duration, buffer times, numeric PHP fee |
| Clinic hours and closures | done | Monday-Friday default, closures calendar, time intervals |
| Doctor profiles | done | Slugs, credentials, bio, photo URL, active toggle |
| Doctor-service links | done | Many-to-many qualification link |
| Doctor weekly availability | done | Daily working intervals and lunch/break times |
| Time off and exceptions | done | UNAVAILABLE, ADDITIONAL, TIME_OFF exception dates |
| Appointment requests | done | Guest and registered requests create PENDING non-blocking slots |
| Approval and auto-assignment | done | Transactional doctor auto-assignment with fair workload balancing |
| No-overlap constraint | done | PostgreSQL `btree_gist` exclusion constraint (`appointments_no_doctor_overlap`) |
| Status history | done | Append-only transition audit log with actor and reason |
| Walk-in queue | done | Daily sequenced queue numbering and waiting queue lifecycle |
| Payments | done | Cash, card, bank, e-wallet; balance calculation & auditable reversals |
| Email outbox and reminders | done | `FOR UPDATE SKIP LOCKED` batch worker, 24h & 2h reminders |
| Audit log | done | Append-only audit trail with actor, action, and metadata |

## Frontend routes

| Route group | State | Notes |
|---|---|---|
| `(public)` | done | Home, `/services`, `/doctors`, `/doctors/[slug]`, `/booking`, `/contact`, `/policies/*` |
| `(auth)` | done | `/login`, `/signup`, `/accept-invite` |
| `guest/manage` | done | Fragment token extraction, token exchange, scoped appointment actions |
| `patient/*` | done | Dashboard, appointments list, profile edit, cancel/reschedule dialogs |
| `doctor/*` | done | Today's schedule, assigned appointments, operational status actions |
| `staff/*` | done | Pending request queue, clinic calendar, walk-in registration & queue, payments |
| `admin/*` | done | Overview KPIs, doctors, staff, services, schedules, settings, audit logs |

## Deployment & Production Readiness

| Item | State | Notes |
|---|---|---|
| Vercel project settings | done | Runbook documented in `docs/04-deployment.md` |
| Render service settings | done | Runbook documented in `docs/04-deployment.md` |
| Neon dev/prod branches | partial | Migration SQL ready; awaiting live Neon connection string |
| Migration policy | done | Additive migrations via Drizzle; journal tracked |
| Backup and restore drill | partial | Pre-launch operational dependency |
| Privacy notice and retention | done | Notice pages in place; pre-pilot legal sign-off required |

## Gate Checks

- [x] Phase 0: Both repositories audited, file trees mapped, clean baseline established
- [x] Phase 1: Shared foundations, env validation, same-origin rewrite, health endpoints, rate limits
- [x] Phase 2: OptiCo database schema, additive Drizzle migration, exclusion constraints
- [x] Phase 3: Auth & Permissions, token rotation, CSRF, staff invitations, guest exchange
- [x] Phase 4: Services catalog, clinic hours, doctor availability, candidate slot engine
- [x] Phase 5: Booking requests, atomic approval with doctor assignment, exclusion constraint conflict handling
- [x] Phase 6: Walk-in registration, daily queue tickets, in-clinic payments and reversals
- [x] Phase 7: Email outbox worker, templates, retry backoff, reminder rescheduling invalidation
- [x] Phase 8: Botanical Premium design system, public pages, patient/doctor/staff/admin portals
- [x] Quality Gates: Lint (0 errors/warnings), TypeScript (0 errors), Vitest (40/40 tests passing across repos), Next.js 16 build (34 routes)
