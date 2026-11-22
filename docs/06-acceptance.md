# Acceptance checks

Run against the Neon `dev` branch and a Vercel preview. Do not use production
patient data.

## Automated

```powershell
cd backend
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build

cd ..\frontend
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Manual flows

1. Register a patient, log in, request an appointment, approve it as staff,
   confirm the assigned doctor, and verify the patient sees `CONFIRMED`.
2. Submit a guest request, receive the link in a test mailbox, exchange the
   token, and confirm only that appointment is visible.
3. Request the same time twice, approve one, and confirm the second approval
   fails with a conflict and no partial state.
4. Give a doctor a break and time off, then confirm those slots disappear.
5. Register a walk-in, queue it, call it, start service, and complete it.
6. Record a partial payment, then the balance, and verify totals and audit rows.
7. Confirm an appointment, check the 24h and 2h outbox rows, reschedule, and
   verify old reminders are gone and new ones exist.
8. Call patient, doctor, staff, and admin endpoints with the wrong role and
   verify 401/403 with no data leak.
9. Verify the Vercel rewrite, cookies, CSRF header, logout, health check, and
   Neon connection on the deployed preview.

## Security spot checks

- Signup with `role: "ADMIN"` in the body still creates a `PATIENT`.
- A patient cannot read another patient's appointment by changing the id.
- A doctor cannot read another doctor's schedule.
- A guest cookie cannot read a different appointment.
- Disabled staff cannot log in.
- Refresh token reuse is rejected.
- `localStorage` contains no token or patient data.
- Logs contain no cookie, token, password, or database URL.

## Release gate

No critical or high issue open. All nine flows pass. Health checks green.
Backup restore exercised on a branch. Privacy review documented.
