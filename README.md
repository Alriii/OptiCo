# OptiCo

Optical clinic appointment and operations platform.

This repository holds the product code and the working record for the project.

```text
frontend/   Next.js app, deployed on Vercel with root directory "frontend"
backend/    Express API, deployed on Render with root directory "backend"
docs/       audit, contract, decisions, phase log
```

| Layer | Platform | Root directory |
|---|---|---|
| Frontend | Vercel | `frontend` |
| Backend | Render | `backend` |
| Database | Neon PostgreSQL | - |

## Documents

- [Repository audit](docs/00-repository-audit.md) - starter state, reuse plan, blockers.
- [Readiness checklist](docs/01-readiness-checklist.md) - spec areas mapped to progress.
- [Phase log](docs/02-phase-log.md) - checkpoint history.
- [API contract](docs/03-api-contract.md) - endpoints, roles, envelopes, time rules.
- [Deployment](docs/04-deployment.md) - Vercel, Render, Neon, email setup.
- [Security](docs/05-security.md) - access, sessions, guest links, privacy baseline.
- [Acceptance](docs/06-acceptance.md) - automated and manual release checks.
- [Decisions](docs/07-decisions.md) - why the repo and key behaviours look this way.
- [Local development](docs/08-local-development.md) - ports, env, seed, common errors.

## Status

Phase 0 audit is complete. Application code is being built in `frontend/` and
`backend/`. Both starter projects were imported with their original history
removed; the source content is replaced as the OptiCo domain lands.
