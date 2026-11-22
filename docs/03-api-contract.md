# API contract

Single convention: `/api/v1/...`. The starter `/api/auth/v1/...` paths are
retired.

## Response envelope

Success:

```json
{ "status": "success", "message": "Optional", "data": {} }
```

Error:

```json
{ "status": "error", "message": "Human readable", "code": 400, "errors": [] }
```

The HTTP status always matches `code`. No stack traces or SQL text in production.

## Auth

| Method | Path | Access | Body |
|---|---|---|---|
| GET | `/auth/csrf-token` | public | - |
| POST | `/auth/signup` | public | `name, email, password` |
| POST | `/auth/login` | public | `email, password` |
| POST | `/auth/refresh` | cookie | - |
| POST | `/auth/logout` | cookie | - |
| GET | `/auth/session` | auth | - |
| POST | `/auth/accept-invite` | public | `token, password` |

Signup always creates `PATIENT`. Staff accounts only exist through an admin
invite. Mutating cookie requests require `x-csrf-token`.

## Public

| Method | Path | Notes |
|---|---|---|
| GET | `/public/clinic` | name, address, phone, email, hours |
| GET | `/public/services` | active services only |
| GET | `/public/doctors` | active doctors only |
| GET | `/public/doctors/:slug` | public profile |
| GET | `/public/availability?serviceId&date` | slots for one Manila date |
| POST | `/public/appointments` | guest booking, returns reference |
| POST | `/public/guest/exchange` | `{ token }`, sets guest cookie |
| GET | `/public/guest/appointment` | guest cookie only |
| POST | `/public/guest/cancel-request` | guest cookie only |

Availability response:

```json
{
  "date": "2026-12-01",
  "timezone": "Asia/Manila",
  "slots": [{ "startAt": "2026-12-01T01:00:00.000Z", "label": "9:00 AM" }]
}
```

## Patient

| Method | Path |
|---|---|
| GET | `/patient/profile` |
| PATCH | `/patient/profile` |
| GET | `/patient/appointments` |
| POST | `/patient/appointments` |
| POST | `/patient/appointments/:id/cancel-request` |
| POST | `/patient/appointments/:id/reschedule-request` |

## Doctor

| Method | Path |
|---|---|
| GET | `/doctor/schedule?date=` |
| GET | `/doctor/appointments` |
| GET | `/doctor/availability` |
| POST | `/doctor/appointments/:id/status` |

Allowed doctor transitions: `CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED`,
plus `NO_SHOW` from `CONFIRMED` or `CHECKED_IN`.

## Staff (receptionist or admin)

| Method | Path |
|---|---|
| GET | `/staff/appointments?status=&date=&page=` |
| GET | `/staff/appointments/:id` |
| POST | `/staff/appointments/:id/approve` |
| POST | `/staff/appointments/:id/reject` |
| POST | `/staff/appointments/:id/cancel` |
| POST | `/staff/appointments/:id/reschedule` |
| POST | `/staff/appointments/:id/check-in` |
| POST | `/staff/appointments/:id/complete` |
| POST | `/staff/appointments/:id/no-show` |
| GET | `/staff/patients?q=` |
| POST | `/staff/walk-ins` |
| GET | `/staff/walk-ins?date=` |
| POST | `/staff/walk-ins/:id/call` |
| POST | `/staff/walk-ins/:id/start` |
| POST | `/staff/walk-ins/:id/complete` |
| POST | `/staff/walk-ins/:id/cancel` |
| POST | `/staff/payments` |
| GET | `/staff/payments?appointmentId=` |

## Admin

| Method | Path |
|---|---|
| GET POST PATCH | `/admin/services` |
| GET POST PATCH | `/admin/doctors` |
| PUT | `/admin/doctors/:id/services` |
| GET PUT | `/admin/clinic-hours` |
| GET POST DELETE | `/admin/closures` |
| GET PUT | `/admin/doctors/:id/availability` |
| POST | `/admin/doctors/:id/exceptions` |
| GET POST | `/admin/staff` |
| PATCH | `/admin/staff/:id` |
| GET PATCH | `/admin/settings` |
| GET | `/admin/audit-logs` |
| GET | `/admin/overview` |

## Health

| Method | Path |
|---|---|
| GET | `/health/live` |
| GET | `/health/ready` |

## Roles

`PATIENT`, `DOCTOR`, `RECEPTIONIST`, `ADMIN`.

## Appointment statuses

`PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`,
`CANCELLED`, `NO_SHOW`.

Only `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS` block a doctor's calendar.

## Time

All timestamps are ISO 8601 UTC. The clinic timezone is `Asia/Manila` (UTC+8,
no daylight saving). Dates in query strings are Manila calendar dates
`YYYY-MM-DD`. Currency is PHP.
