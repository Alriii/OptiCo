# Readiness checklist

Each row is a spec area, not a feature wishlist. Status values:

- `done` - exists and matches the spec
- `partial` - exists but needs repair or extension
- `missing` - not present
- `n/a` - starter content, to be removed

## Foundations

| Area | Frontend | Backend | Notes |
|---|---|---|---|
| Framework version | done | done | Next 16 / Express 5 |
| Language and types | done | done | TypeScript strict |
| UI system | done | n/a | shadcn/Radix + Tailwind 4 |
| Env example | missing | partial | Frontend ignores `.env*`; backend example has wrong ports |
| Secret validation at boot | n/a | missing | JWT fallback still active |
| API rewrite (same origin) | missing | n/a | Needed for Vercel to Render |
| Health and readiness | n/a | partial | No DB probe |
| Graceful shutdown | n/a | missing | |
| Request IDs and logging | missing | missing | |
| Rate limiting | n/a | missing | |
| Test runner | missing | missing | |
| Lint, typecheck, build | done | done | All pass |

## Identity and access

| Area | Frontend | Backend |
|---|---|---|
| Login form | done | done |
| Signup form | done | done |
| CSRF exchange | missing | done |
| Session endpoint contract | broken (`/me`) | done (`/session`) |
| Refresh rotation | done (interceptor) | done |
| Logout | done | done |
| Role model | partial (2 roles) | partial (2 roles) |
| Staff invitation | missing | missing |
| Account status / disable | missing | missing |
| Email verification | page only | missing |
| Guest link exchange | missing | missing |

## Clinic domain

| Area | State |
|---|---|
| Services and fees | missing |
| Clinic hours and closures | missing |
| Doctor profiles | missing |
| Doctor-service links | missing |
| Doctor weekly availability | missing |
| Time off and exceptions | missing |
| Appointment requests | missing |
| Approval and auto-assignment | missing |
| No-overlap constraint | missing |
| Status history | missing |
| Walk-in queue | missing |
| Payments | missing |
| Email outbox and reminders | missing |
| Audit log | missing |

## Frontend routes

| Route group | State |
|---|---|
| `(public)` home, services, doctors, booking | missing (portfolio pages exist) |
| `(auth)` login, signup | done |
| `guest/manage` | missing |
| `patient/*` | missing |
| `doctor/*` | missing |
| `staff/*` | missing |
| `admin/*` | partial (blog, users only) |

## Deployment

| Item | State |
|---|---|
| Vercel project settings | missing |
| Render service settings | partial |
| Neon dev/prod branches | missing |
| Migration policy | missing |
| Backup and restore drill | missing |
| Privacy notice and retention | missing |

## Gate to leave Phase 0

- [x] Both repositories cloned and inspected
- [x] File trees and dependency maps recorded
- [x] Auth and cookie flow traced
- [x] Endpoint mismatches listed
- [x] Baseline lint, typecheck, build recorded
- [x] Safe change plan written

## Gate to leave Phase 1

- [ ] `.env.example` committed in both repositories
- [ ] Same-origin `/api` rewrite working locally
- [ ] CSRF token fetched before login and signup
- [ ] `/me` replaced by `/session` everywhere
- [ ] Secrets validated at backend startup
- [ ] Readiness endpoint queries the database
- [ ] Rate limiting and request IDs added
- [ ] Test scripts added to both packages
- [ ] Clean install, lint, typecheck, build pass
