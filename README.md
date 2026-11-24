# OptiCo

Optical clinic appointment management system.

---

## Core Modules

- **Patient Booking**: Verified online appointment scheduling.
- **Doctor Portal**: Manage daily clinical schedules.
- **Reception Desk**: Triage walk-ins and appointments.
- **Admin Suite**: Configure services and doctors.
- **Audit Logging**: Immutable record of changes.

---

## Tech Stack

- **Frontend App**: React 19 single page.
- **Build Tooling**: Vite with TypeScript support.
- **Interface Styling**: Tailwind CSS with Radix.
- **Backend API**: Express RESTful service architecture.
- **Database Engine**: PostgreSQL on Neon serverless.
- **Schema Mapping**: Drizzle ORM migration management.
- **Authentication**: HTTP-only JWT token rotation.

---

## Project Structure

```text
OptiCo/
├── frontend/               # Client single page application
│   ├── app/                # Public and portal routes
│   ├── components/         # Shared UI and features
│   ├── context/            # Global authentication state
│   ├── lib/                # Utility and helper functions
│   └── services/           # Typed API client services
└── backend/                # Express API and database
    ├── src/config/         # Runtime environment settings
    ├── src/controllers/    # Route handler controllers
    ├── src/db/             # Database schema and migrations
    ├── src/middlewares/    # Auth, security, error handlers
    ├── src/repositories/   # Database query access layer
    └── src/services/       # Core domain business logic
```

---

## Local Setup

### 1. Backend Service
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Client
```bash
cd frontend
npm install
npm run dev
```

---

## Security Controls

- **CSRF Defense**: Double submit cookie validation.
- **Header Hardening**: Strict Helmet security policies.
- **Rate Limiting**: Prevent abuse on endpoints.
- **Route Protection**: Role-based access control checks.

---

## Quality Assurance

- **Unit Testing**: Vitest test runner execution.
- **Static Analysis**: TypeScript strict compiler verification.
