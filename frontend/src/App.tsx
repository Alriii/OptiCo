import { Routes, Route, Outlet, Link, Navigate } from "react-router-dom";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { PortalShell } from "@/components/shared/portal-shell";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/public/public-footer";
import { DEMO_NOTICE } from "@/lib/demo-clinic";

// Public pages
import HomePage from "@/app/(public)/page";
import ServicesPage from "@/app/(public)/services/page";
import DoctorsPage from "@/app/(public)/doctors/page";
import DoctorProfilePage from "@/app/(public)/doctors/[slug]/page";
import BookingPage from "@/app/(public)/booking/page";
import GuestManagePage from "@/app/(public)/guest/manage/page";
import ContactPage from "@/app/(public)/contact/page";
import CancellationPage from "@/app/(public)/policies/cancellation/page";
import PrivacyPage from "@/app/(public)/policies/privacy/page";
import TermsPage from "@/app/(public)/policies/terms/page";

// Auth pages
import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";
import AcceptInvitePage from "@/app/(auth)/accept-invite/page";

// Portal redirect
import PortalRedirectPage from "@/app/portal/page";

// Patient portal pages
import PatientDashboardPage from "@/app/patient/page";
import PatientAppointmentsPage from "@/app/patient/appointments/page";
import PatientProfilePage from "@/app/patient/profile/page";

// Doctor portal pages
import DoctorDashboardPage from "@/app/doctor/page";
import DoctorSchedulePage from "@/app/doctor/schedule/page";
import DoctorAvailabilityPage from "@/app/doctor/availability/page";

// Staff portal pages
import StaffQueuePage from "@/app/staff/page";
import StaffAppointmentsPage from "@/app/staff/appointments/page";
import StaffCalendarPage from "@/app/staff/calendar/page";
import StaffWalkInsPage from "@/app/staff/walk-ins/page";
import StaffPaymentsPage from "@/app/staff/payments/page";

// Admin portal pages
import AdminOverviewPage from "@/app/admin/page";
import AdminDoctorsPage from "@/app/admin/doctors/page";
import AdminStaffPage from "@/app/admin/staff/page";
import AdminServicesPage from "@/app/admin/services/page";
import AdminSchedulesPage from "@/app/admin/schedules/page";
import AdminSettingsPage from "@/app/admin/settings/page";
import AdminAuditLogsPage from "@/app/admin/audit-logs/page";

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

function AuthLayout() {
  return (
    <AuthGuard guestOnly>
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-foreground text-sm font-semibold text-primary">
              O
            </span>
            <span className="text-lg font-semibold">OptiCo</span>
          </Link>

          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              Optical clinic appointments
            </p>
            <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
              A calmer way to keep your eye care schedule in order.
            </h1>
            <ul className="space-y-4 text-sm text-primary-foreground/85">
              <li className="flex gap-3">
                <CalendarCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                Request, review, and track appointments in one place.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                Role-based portals keep patient and clinic work separate.
              </li>
            </ul>
          </div>

          <p className="max-w-sm text-xs leading-relaxed text-primary-foreground/60">
            {DEMO_NOTICE}
          </p>
        </aside>

        <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md space-y-6">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 lg:hidden"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                O
              </span>
              <span className="text-lg font-semibold">OptiCo</span>
            </Link>
            <Outlet />
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/" className="underline underline-offset-4">
                Back to the clinic site
              </Link>
            </p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function PatientPortalLayout() {
  return (
    <AuthGuard roles={["PATIENT"]}>
      <PortalShell role="PATIENT">
        <Outlet />
      </PortalShell>
    </AuthGuard>
  );
}

function DoctorPortalLayout() {
  return (
    <AuthGuard roles={["DOCTOR"]}>
      <PortalShell role="DOCTOR">
        <Outlet />
      </PortalShell>
    </AuthGuard>
  );
}

function StaffPortalLayout() {
  return (
    <AuthGuard roles={["RECEPTIONIST", "ADMIN"]}>
      <PortalShell role="RECEPTIONIST">
        <Outlet />
      </PortalShell>
    </AuthGuard>
  );
}

function AdminPortalLayout() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <PortalShell role="ADMIN">
        <Outlet />
      </PortalShell>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:slug" element={<DoctorProfilePage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/guest/manage" element={<GuestManagePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/policies/cancellation" element={<CancellationPage />} />
        <Route path="/policies/privacy" element={<PrivacyPage />} />
        <Route path="/policies/terms" element={<TermsPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
      </Route>

      {/* Universal portal redirect */}
      <Route path="/portal" element={<PortalRedirectPage />} />

      {/* Patient portal */}
      <Route element={<PatientPortalLayout />}>
        <Route path="/patient" element={<PatientDashboardPage />} />
        <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
        <Route path="/patient/profile" element={<PatientProfilePage />} />
      </Route>

      {/* Doctor portal */}
      <Route element={<DoctorPortalLayout />}>
        <Route path="/doctor" element={<DoctorDashboardPage />} />
        <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
        <Route path="/doctor/availability" element={<DoctorAvailabilityPage />} />
      </Route>

      {/* Staff portal */}
      <Route element={<StaffPortalLayout />}>
        <Route path="/staff" element={<StaffQueuePage />} />
        <Route path="/staff/appointments" element={<StaffAppointmentsPage />} />
        <Route path="/staff/calendar" element={<StaffCalendarPage />} />
        <Route path="/staff/walk-ins" element={<StaffWalkInsPage />} />
        <Route path="/staff/payments" element={<StaffPaymentsPage />} />
      </Route>

      {/* Admin portal */}
      <Route element={<AdminPortalLayout />}>
        <Route path="/admin" element={<AdminOverviewPage />} />
        <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
        <Route path="/admin/staff" element={<AdminStaffPage />} />
        <Route path="/admin/services" element={<AdminServicesPage />} />
        <Route path="/admin/schedules" element={<AdminSchedulesPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
