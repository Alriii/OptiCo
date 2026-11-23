# OptiCo frontend

React 19 single-page app built with Vite and React Router. The original
Next.js App Router pages still live under `app/`; `next/link` and
`next/navigation` are aliased to the shims in `lib/` so those files keep
working without a rewrite.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3001 |
| `npm run build` | Type-check and build to `dist/` |
| `npm start` | Preview the production build on port 3001 |
| `npm run lint` | ESLint |
| `npm test` | Vitest, single run |

## API calls

`lib/axios.ts` always requests `/api/v1` on the current origin. Locally,
`vite.config.ts` proxies `/api` to `BACKEND_INTERNAL_URL` (default
`http://localhost:7000`). In production, `vercel.json` rewrites `/api` to the
Render service. Keeping the API same-origin means auth cookies stay first-party.

## Environment

Copy `.env.example` to `.env.local` if the backend runs somewhere other than
`http://localhost:7000`.

## Deploy

Vercel project root: `frontend`. Framework preset: Vite. Build: `npm run build`.
Output: `dist`. If the Render service URL changes, update the `/api` rewrite in
`vercel.json`.
