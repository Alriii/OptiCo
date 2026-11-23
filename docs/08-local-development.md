# Local development

Node 24 and npm 11 are expected. PostgreSQL is either a local instance or a
Neon development branch.

## Ports

| Service | Port |
|---|---|
| Vite | 3001 |
| Express | 7000 |

The browser only calls `http://localhost:3001/api/...`. The Vite dev server
proxies that to `http://localhost:7000/api/...`.

## Backend

```powershell
cd backend
copy .env.example .env
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

`.env` needs at minimum:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars>
CSRF_SECRET=<32+ chars>
FRONTEND_URL=http://localhost:3001
FRONTEND_ORIGINS=http://localhost:3001
BACKEND_URL=http://localhost:7000
APP_PUBLIC_URL=http://localhost:3001
```

Leave `SMTP_HOST` empty to keep the outbox worker in dry-run mode. Invite and
reminder rows stay queued and log `email skipped`.

## Frontend

```powershell
cd frontend
copy .env.example .env.local
npm ci
npm run dev
```

```env
BACKEND_INTERNAL_URL=http://localhost:7000
```

## Demo accounts

The seed script creates sample data and marks it as demo. Default accounts are
printed by the seed command. Change the passwords before any shared deployment.

## Useful commands

| Command | Where | Purpose |
|---|---|---|
| `npm run dev` | both | local servers |
| `npm run db:generate` | backend | generate a migration |
| `npm run db:migrate` | backend | apply migrations |
| `npm run db:seed` | backend | demo clinic, services, staff |
| `npm test` | both | unit tests |
| `npm run build` | both | production build |
| `npx tsc --noEmit` | both | type check |

## Common problems

- `401` on every request: the access cookie expired and refresh failed. Check
  `JWT_SECRET` is the same across restarts.
- `403 Invalid or missing CSRF token`: the frontend did not fetch
  `/api/v1/auth/csrf-token` or lost the token after a rotation.
- Availability is empty: check clinic hours, doctor weekly availability, and
  doctor-service links. A doctor with no schedule is never assigned.
- Approval returns `409`: another confirmed appointment occupies the interval,
  including buffers. Pick another time.
