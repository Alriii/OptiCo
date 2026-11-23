# OptiCo · Optical Clinic & Intelligent Care Management

<div align="center">
  <img src="frontend/public/mascot.jpg" alt="Dr. Octo - OptiCo Mascot" width="140" style="border-radius: 28px; box-shadow: 0 10px 25px -5px rgba(18, 107, 96, 0.3);" />
  <br />
  <h3>Calmer vision care, tailored for you.</h3>
  <p>An enterprise-grade optical clinic operations, diagnostic scheduling, and unified patient care platform.</p>
  <p>
    <a href="https://opti-co.vercel.app/"><strong>Explore Live Application »</strong></a>
    <br />
    <a href="https://optico-wsi9.onrender.com/api/v1/health/live">Backend API Health</a>
    ·
    <a href="https://opt-co.vercel.app/login">Portal Access</a>
  </p>
</div>

---

## About OptiCo

**OptiCo** is a full-stack digital clinic system designed for modern optometry clinics and eyewear diagnostic centers. Guided by the clinic character **Dr. Octo**, OptiCo bridges public patient booking with specialized back-office workflows for optometrists, receptionists, and clinic administrators.

The system handles the entire lifecycle of an optical visit: from initial online appointment requests and walk-in queue management to optometrist availability assignment, diagnostic cashiering, and comprehensive audit logs.

### Key Capabilities

* **Public Patient Booking**: Browse optical services and optometrists, check live availability, and request consultation slots with automated minor-patient guardian validation.
* **Guest Booking Management**: Frictionless guest bookings accessed through secure, token-scoped private URLs—no account creation required.
* **Patient Portal**: Personalized dashboard with active appointment tracking, Dr. Octo's 20-20-20 vision health tips, rescheduling, and request cancellation.
* **Doctor Schedule Portal**: Daily assigned patient timeline, live consultation status controls (Checked In, In Progress, Completed), and recurring schedule configuration.
* **Staff Reception Desk**: Instant walk-in registration, pending request approval queue with conflict revalidation, clinic calendar, and integrated payment cashiering.
* **Admin Management Suite**: Full control over service catalogs (pricing, duration), doctor credentialing & service eligibility mapping, staff invitations with RBAC, and system audit logs.
* **Enterprise Security Baseline**: First-party HTTP-only cookie authentication, access and refresh JWT rotation, Double Submit Cookie CSRF defense with strict origin allowlisting, and Helmet security headers.

---

## Tech Stack

### Frontend Application
* **Framework**: [React 19](https://react.dev/) (Single Page Application architecture)
* **Build Tooling**: [Vite 6](https://vite.dev/) with [TypeScript 5](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a custom Clinical Mint & Oceanic Teal palette
* **UI & Primitives**: [Radix UI](https://www.radix-ui.com/) accessible primitives (`@radix-ui/react-dropdown-menu`, dialogs, avatars)
* **Routing**: [React Router v7](https://reactrouter.com/)
* **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) schema enforcement
* **Icons & Notifications**: [Lucide React](https://lucide.dev/) & [Sonner](https://sonner.emilkowal.ski/) toast system
* **Testing**: [Vitest](https://vitest.dev/) & React Testing Library

### Backend API
* **Runtime & Framework**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (RESTful API in TypeScript)
* **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) hosted on [Neon](https://neon.tech/) serverless, managed with [Drizzle ORM](https://orm.drizzle.team/)
* **Authentication**: First-party HTTP-only JWTs (`jsonwebtoken`), `bcryptjs` password hashing, token rotation
* **Security Middleware**: `helmet`, `cors`, custom CSRF middleware with Vercel origin validation, and `express-rate-limit`
* **Testing**: [Vitest](https://vitest.dev/) unit and integration test suites

### Infrastructure & Deployment
* **Client App**: [Vercel](https://vercel.com/) ([opti-co.vercel.app](https://opti-co.vercel.app/))
* **Server API**: [Render](https://render.com/) ([optico-wsi9.onrender.com](https://optico-wsi9.onrender.com/))
* **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)

---

## Repository Structure

```text
OptiCo/
├── frontend/               # React 19 + Vite client application
│   ├── app/                # Application routes (public, auth, patient, doctor, staff, admin)
│   ├── components/         # Modular UI components (features, portal, public, shared, ui)
│   ├── context/            # React global context providers (AuthContext)
│   ├── lib/                # Utility helpers, date formatting, clinic photography helpers
│   ├── public/             # Static public assets (mascot.jpg, logos, favicon)
│   ├── services/           # Typed API service clients
│   ├── styles/             # Global CSS and Tailwind CSS v4 design tokens
│   └── src/                # Vite SPA bootstrap and routing configuration
├── backend/                # Express.js REST API
│   ├── drizzle/            # SQL migration files and schema snapshots
│   ├── src/                # API source code
│   │   ├── config/         # Environment variables and configurations
│   │   ├── controllers/    # Route controllers (auth, public, patient, doctor, staff, admin)
│   │   ├── db/             # Drizzle client, table schemas, and database seeders
│   │   ├── lib/            # Business logic helpers (status transitions, permissions, JWTs)
│   │   ├── middlewares/    # Security, auth, CSRF, rate-limiting, and error handlers
│   │   ├── repositories/   # Data access layers
│   │   ├── routes/         # Express router endpoints
│   │   └── services/       # Core business workflows and notifications
│   └── test/               # Vitest unit and integration test suites
├── .gitignore              # Git ignore rules
└── README.md               # Repository documentation and setup guide
```

---

## Local Development Setup

### Prerequisites
* **Node.js**: v20 or higher
* **npm**: v10 or higher
* **PostgreSQL**: Local instance or a free Neon database connection string

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables in `.env`:
   ```env
   NODE_ENV=development
   PORT=7000
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   JWT_SECRET=your-secure-jwt-secret-at-least-32-chars
   FRONTEND_URL=http://localhost:3001
   FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001,https://opti-co.vercel.app
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. (Optional) Seed demo clinic data (doctors, services, schedules):
   ```bash
   npm run db:seed
   ```

6. Start the API server:
   ```bash
   npm run dev
   ```
   The backend will be available at `http://localhost:7000`.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your frontend environment variables in `.env`:
   ```env
   BACKEND_INTERNAL_URL=http://localhost:7000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3001`.

---

## Demo Accounts

When testing locally or on the live deployment, 1-click preset logins are available on the [Login Page](https://opti-co.vercel.app/login):

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@optico.local` | `Password123!` | Full clinic administration, catalog, staff & audit logs |
| **Doctor** | `doctor.reyes@optico.local` | `Password123!` | Assigned appointments, consultation status & schedule |
| **Staff** | `receptionist@optico.local` | `Password123!` | Request queue, walk-in reception, calendar & payments |
| **Patient** | `patient@optico.local` | `Password123!` | Personal visits, bookings, rescheduling & profile |

---

## Quality & Testing

Both projects maintain automated test suites and strict linting standards:

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests and type checks
cd frontend && npm run lint && npm test && npm run build
```

---

## License

This project is licensed under the [MIT License](LICENSE).
