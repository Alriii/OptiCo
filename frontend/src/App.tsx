import { Routes, Route, Outlet, Link, Navigate } from "react-router-dom";
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
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#162a24] via-[#1f3b33] to-[#12221d] p-8 text-primary-foreground xl:p-12 lg:flex">
          {/* Subtle ambient light rings */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full bg-teal-500/10 blur-3xl" />

          {/* Top Logo */}
          <Link to="/" className="relative z-10 flex items-center gap-3">
            <img
              src="/mascot.jpg"
              alt="OptiCo Mascot"
              className="size-10 rounded-full object-cover ring-2 ring-emerald-300/30 shadow-md"
            />
            <div>
              <span className="text-lg font-semibold tracking-tight text-white">OptiCo</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-emerald-300/70">
                Optical Clinic
              </span>
            </div>
          </Link>

          {/* Center Mascot Showcase Card */}
          <div className="relative z-10 my-auto py-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
              <div className="relative mx-auto mb-5 flex justify-center">
                <div className="absolute inset-0 scale-95 rounded-3xl bg-emerald-400/20 blur-xl" />
                <img
                  src="/mascot.jpg"
                  alt="Dr. Octo - OptiCo Mascot"
                  className="relative size-44 rounded-2xl object-cover shadow-xl ring-2 ring-white/20 transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>

              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                  ✦ Meet Dr. Octo
                </span>
                <h2 className="mt-2 text-xl font-medium tracking-tight text-white">
                  Calmer vision care, tailored for you.
                </h2>
                <p className="mt-1 text-xs text-emerald-100/70">
                  Precision optical schedules, walk-in management & unified patient care.
                </p>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-[10px] text-emerald-300">✓</span>
                  <span>Real-time appointment slots with verified optometrists</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-[10px] text-emerald-300">✓</span>
                  <span>Tailored portals for Patients, Doctors, Staff & Admins</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-[10px] text-emerald-300">✓</span>
                  <span>Instant walk-in queueing & clinic cashiering</span>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 max-w-sm text-xs leading-relaxed text-white/50">
            {DEMO_NOTICE}
          </p>
        </aside>

        <main className="flex flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">
          <div className="w-full max-w-md space-y-5">
            <Link
              to="/"
              className="flex items-center justify-center gap-2.5 lg:hidden"
            >
              <img
                src="/mascot.jpg"
                alt="OptiCo Mascot"
                className="size-9 rounded-full object-cover ring-2 ring-primary/20 shadow-xs"
              />
              <span className="flex flex-col leading-none">
                <span className="text-base font-semibold tracking-tight text-foreground">OptiCo</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Optical Clinic
                </span>
              </span>
            </Link>
            <Outlet />
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/" className="underline underline-offset-4 hover:text-foreground">
                ← Back to the clinic site
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
