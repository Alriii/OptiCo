# Deployment runbook

Three platforms, one repository.

| Layer | Platform | Root directory | Runtime |
|---|---|---|---|
| Frontend | Vercel | `frontend` | Node 24 |
| Backend | Render | `backend` | Node 24 |
| Database | Neon | - | PostgreSQL |

## Neon

1. Create one project, `optico`.
2. Keep two branches: `main` (production) and `dev` (development and preview).
3. Copy two connection strings per branch:
   - pooled, for the Render runtime (`-pooler` host)
   - direct, for migrations
4. Put the pooled URL in `DATABASE_URL` and the direct URL in
   `MIGRATION_DATABASE_URL`.
5. Require TLS (`sslmode=require`) in both.
6. Do not point preview deployments at the production branch.

Migration policy:

- `drizzle/0000_cold_vector.sql` is starter history. Do not edit it.
- New schema lives in reviewed additive migrations.
- Run `npm run db:migrate` against the direct URL before deploying the API build.
- Never run migrations at application startup.
- Branch the database before a risky change, and keep the branch until the
  deploy is verified.

## Render

Web service settings:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/v1/health/ready` |
| Auto deploy | on `main` |

Environment:

```env
NODE_ENV=production
PORT=10000
APP_NAME=OptiCo API
APP_PUBLIC_URL=https://<frontend-domain>
FRONTEND_URL=https://<frontend-domain>
FRONTEND_ORIGINS=https://<frontend-domain>
BACKEND_URL=https://<api-domain>
DATABASE_URL=<neon-pooled>
MIGRATION_DATABASE_URL=<neon-direct>
JWT_SECRET=<32+ random chars>
CSRF_SECRET=<different 32+ random chars>
SMTP_HOST=<provider>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<user>
SMTP_PASS=<password>
SMTP_FROM_NAME=OptiCo
SMTP_FROM_EMAIL=<verified sender>
GUEST_LINK_TTL_HOURS=168
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=7
```

Notes:

- The server binds `0.0.0.0` and `process.env.PORT`.
- Startup fails when required secrets are missing in production.
- Cookies are `SameSite=Lax` because the browser talks to the Vercel origin,
  not to Render directly.
- If Render's plan supports pre-deploy commands, use
  `npm run db:migrate` with the direct URL. Otherwise run it as a controlled
  one-off job before the deploy.

## Vercel

Project settings:

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework | Vite |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | `dist` |
| Node | 24.x |

`frontend/vercel.json` owns two rewrites:

- `/api/:path*` to `https://optico-wsi9.onrender.com/api/:path*`
- every other path to `/index.html`, so client-side routes survive a refresh

The browser only sees the Vercel origin, which keeps auth cookies first-party and
avoids third-party cookie blocking. If the Render service URL is different from
the blueprint name, update the first rewrite.

No Vercel environment variables are required. `BACKEND_INTERNAL_URL` is only
read by the local Vite proxy.

Checklist after the first deploy:

- Login sets `accessToken` and `refreshToken` on the Vercel domain.
- `x-csrf-token` survives the rewrite.
- `Set-Cookie` from Render reaches the browser unchanged.
- Logout clears all four cookies.
- Guest exchange works and removes the fragment.
- A direct visit to `/admin/services` loads the app instead of a 404.
- `/api/v1/health/ready` returns 200 through the Vercel origin.

## Email

Use a provider with a verified sending domain. Publish SPF, DKIM, and DMARC
before enabling reminders. Send to a test mailbox first. The outbox worker runs
inside the API process and claims rows with `FOR UPDATE SKIP LOCKED`.

If `SMTP_HOST` is empty, the worker logs `email skipped` and leaves rows
untouched. That is the local development behaviour.

## Order of operations

1. Migrate the Neon `dev` branch.
2. Deploy the backend to a Render preview.
3. Point a Vercel preview at that Render URL.
4. Run the acceptance flows from the spec.
5. Migrate the Neon `main` branch.
6. Deploy backend, then frontend, to production.
7. Verify health, login, booking, approval, payment, and one reminder.
