# Repository audit

Scope: structure and technology only. Page copy, blog posts, recipes, and other
starter content are out of scope.

## What was inspected

| Repository | Branch | Commit | Files (tracked, no build output) |
|---|---|---|---|
| portfolio-frontend-itelect2 | main | `e94a412` | 109 |
| appsdev-api-tutorial | main | `f5a1a99` | 52 |

Commands were run from a clean `npm ci` in each repository. Results are at the
bottom of this document.

## Short answer

The stack is ready. The structure is half ready. The domain is not started.

- **Technology:** both repositories already use the exact frameworks, libraries,
  and hosting targets required. Nothing has to be replaced.
- **Structure:** the backend has a clean layered flow that can be extended as is.
  The frontend has reusable providers, guards, and UI primitives, but its route
  tree only knows two roles and one product area.
- **Content:** everything visible is still portfolio/blog/recipe material. It has
  to be retired or replaced, but that does not affect the stack decision.

## Frontend

### Stack (matches target)

Next.js 16.1.4 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS 4,
shadcn/Radix primitives, React Hook Form, Zod 4, Axios, Sonner, next-themes,
lucide-react. Node 24 is installed locally.

### Structure

```text
app/
  (auth)/        login, signup, verify-email
  (guest)/       home, about, blog, projects, contact
  admin/         blog, knowledgebase, users
components/
  common/        header, footer, section helpers
  features/      auth, admin, blog, home, projects
  provider/      theme provider
  ui/            11 Radix-based primitives
context/         AuthContext
lib/             axios instance, class name helper
services/        auth, blog, knowledge, ai
styles/          globals.css
proxy.ts         cookie-presence redirect
```

### Reusable as is

- Root layout with theme provider and toaster.
- `AuthContext` shape (user, login, signup, logout, loading flag).
- Axios instance with single-flight refresh queue.
- `AuthGuard` with guest/private/admin modes.
- UI primitives: button, card, input, label, field, select, table, dialog,
  dropdown, badge, separator.
- `cn()` helper and Tailwind theme variables.

### Structural gaps

| # | Severity | Finding |
|---|---|---|
| F1 | Critical | No CSRF handling. The backend rejects browser-origin `POST /login` and `/signup` without `x-csrf-token`, and the frontend never calls `/api/auth/v1/csrf-token`. Auth cannot work end to end. |
| F2 | Critical | `authService.getMe()` calls `/api/auth/v1/me`; the backend exposes `/api/auth/v1/session`. Session restore always 404s. |
| F3 | High | `lib/axios.ts` reads `NEXT_PUBLIC_BACKEND_URL`, which is undefined locally and at build time. Static generation of `/blog` already logs `Cannot read properties of undefined (reading 'method')`. |
| F4 | High | No same-origin `/api` rewrite in `next.config.ts`, so the planned Vercel-to-Render proxy is missing. |
| F5 | High | Only `USER` and `ADMIN` are understood. No patient, doctor, or receptionist route group or guard. |
| F6 | High | User profile is persisted in `localStorage`, which the spec forbids for patient data. |
| F7 | Medium | `components.json` points to `app/globals.css`; the real file is `styles/globals.css`. |
| F8 | Medium | `proxy.ts` sends any authenticated visitor from `/login` to `/admin`, including non-admins. |
| F9 | Medium | `.gitignore` ignores `.env*`, so a committed `.env.example` is impossible without an exception rule. |
| F10 | Medium | No test runner or `test` script. |
| F11 | Low | `hooks` alias is declared in `components.json` but the directory does not exist. |
| F12 | Low | Service responses are untyped (`any`); no shared DTOs or response envelope. |

### Content to retire

Blog routes and services, knowledge base admin, projects, AI chatbot, portfolio
home/about/contact sections. Roughly 40 feature components. They are isolated
under `(guest)`, `admin`, and `components/features`, so removal is contained.

## Backend

### Stack (matches target)

Express 5.2.1, TypeScript 6, Drizzle ORM 0.45 with `pg` Pool, drizzle-kit 0.31,
Zod 4, bcrypt, jsonwebtoken, cookie-parser, cors, csrf-csrf, helmet, hpp,
nodemailer, tsx, tsdown, ESLint.

### Structure

```text
src/
  app.ts          express app, cors, helmet, health, routes, error handler
  server.ts       listener
  config/         env object
  db/             pool, drizzle client, schema
  routes/         auth, recipes
  middlewares/    auth, csrf, role, schema
  controllers/    auth, recipe
  services/       auth/*, recipes/*
  repositories/   user, token, recipe
  lib/            jwt, cookies, csrf
  schema/         zod request schemas
drizzle/          0000 migration and journal
```

The flow `route -> middleware -> controller -> service -> repository -> db` is
consistent and worth keeping. No SQL lives in controllers.

### Reusable as is

- Express app factory and error handler.
- JWT sign/verify helpers with typed access/refresh payloads.
- Cookie helper with HttpOnly, Secure, SameSite, path, and matching clear.
- CSRF double-submit setup with a production secret guard.
- Zod validation middleware.
- Auth middleware with bearer + cookie fallback.
- Refresh token rotation with consume/revoke in the database.
- Drizzle pool singleton and schema export pattern.

### Structural gaps

| # | Severity | Finding |
|---|---|---|
| B1 | Critical | Schema is tutorial-only (`user`, `recipe`, `token`). No clinic tables, no constraints, no indexes beyond the recipe/token pair. |
| B2 | Critical | Role enum is `USER`/`ADMIN`. No `PATIENT`, `DOCTOR`, `RECEPTIONIST`, no account status, no invitation flow. |
| B3 | Critical | Refresh tokens are stored raw. The spec requires a hash at rest. |
| B4 | Critical | No rate limiting on login, signup, refresh, or any future public endpoint. |
| B5 | High | `JWT_SECRET` has a hard-coded fallback and startup does not fail when secrets are missing. `CSRF_SECRET` is optional outside production. |
| B6 | High | No tests, although `docs/csrf-auth.md` references `src/tests/csrf.test.ts`, which does not exist. |
| B7 | High | Nodemailer is installed but no mail service, template, or outbox exists. |
| B8 | High | Health endpoints do not touch the database, and there is no graceful shutdown for the HTTP server or pool. |
| B9 | High | CORS allows one origin and production cookies use `SameSite=None`. That is the cross-site setup the spec asks to replace with a same-origin rewrite. |
| B10 | Medium | Zod middleware validates but discards the parsed result, so unknown keys still reach controllers. |
| B11 | Medium | No request IDs, no structured logging, no redaction of cookies, tokens, or database URLs. |
| B12 | Medium | Token lifetimes are duplicated in code (`7d` hard-coded twice) instead of coming from config. |
| B13 | Medium | Env defaults disagree: `BACKEND_URL` falls back to port 8000 while `.env.example` uses 7880; `FRONTEND_URL` is 3000 vs 5173. |
| B14 | Low | `package.json` declares `"type": "commonjs"` while the build emits ESM `.mjs`. It works, but it is inconsistent. |
| B15 | Low | No `engines` field; Node version is not pinned for Render. |
| B16 | Low | `drizzle.config.ts` only reads `DATABASE_URL`; no direct migration URL for Neon. |

### Content to retire

Recipe routes, controller, service, repository, schema, migration, and the
`docs/recipes-api.md` and tutorial docs. Keep `user` and `token` only if the
OptiCo identity tables can reuse them; otherwise replace with additive
migrations.

## Deployment state

| Target | Present | Missing |
|---|---|---|
| Vercel | Next.js build succeeds | `/api` rewrite, `BACKEND_INTERNAL_URL`, preview/production env split |
| Render | `build` and `start` scripts work, `dist/server.mjs` is produced | DB-backed readiness path, Node pin, rate limits, graceful shutdown |
| Neon | `pg` Pool and Drizzle wiring | pooled vs direct URL split, migration policy, branch strategy |

## Verification results

Run locally on Node 24.21.0, npm 11.19.0.

| Check | Frontend | Backend |
|---|---|---|
| `npm ci` | pass | pass |
| Type check (`tsc --noEmit`) | pass | pass |
| Lint | pass | pass |
| Build | pass (with SSR fetch error logged) | pass, `dist/server.mjs` 18.97 kB |
| Tests | no runner | no runner |

Notes:

- The frontend build completes but logs `Error fetching blogs for SSR` because
  the API base URL is undefined during prerender. This is a real symptom of F3.
- npm 11 skipped install scripts for `bcrypt` and `sharp` during `npm ci`. Both
  packages normally rely on prebuilt binaries, but the Render and Vercel build
  logs should be checked after the first deploy.

## Verdict

Against the target spec, scored on structure and stack only:

| Area | State | Score |
|---|---|---|
| Frontend stack | Exact match | 10/10 |
| Backend stack | Exact match | 10/10 |
| Backend layering | Clean, extendable | 8/10 |
| Frontend structure | Reusable shell, single-role tree | 6/10 |
| Domain structure | Not started | 1/10 |
| Cross-repo contract | Two mismatches already | 2/10 |
| Security baseline | Partial | 4/10 |
| Deployment wiring | Partial | 4/10 |
| Test infrastructure | Absent | 0/10 |

**Readiness: Not ready for product work beyond Phase 1.** The foundation is
worth keeping. Do not scaffold a replacement project. Fix the contract and
configuration issues first, then build the clinic schema.
