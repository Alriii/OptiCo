import { Routes, Route, Outlet, Link, Navigate } from "react-router-dom";
import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { PortalShell } from "@/components/shared/portal-shell";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/public/public-footer";

// Public pages
import HomePage from "@/app/(public)/page";
import ServicesPage from "@/app/(public)/services/page";
import DoctorsPage from "@/app/(public)/doctors/page";
import DoctorProfilePage from "@/app/(public)/doctors/[slug]/page";
import BookingPage from "@/app/(public)/booking/page";
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
        <aside className="relative hidden flex-col justify-between overflow-hidden p-8 text-primary-foreground xl:p-12 lg:flex">
          {/* High-Resolution Optical Clinic Photography Backdrop */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1400&q=85"
              alt="OptiCo Clinic Interior"
              className="size-full object-cover"
              loading="eager"
            />
            {/* Deep Oceanic Tint Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#081c19]/95 via-[#0d342d]/80 to-[#081c19]/65 backdrop-blur-[1px]" />
          </div>

          {/* Top Logo */}
          <Link to="/" className="relative z-10 flex items-center gap-3">
            <img
              src="/mascot.jpg"
              alt="OptiCo Mascot"
              className="size-10 rounded-full object-cover ring-2 ring-emerald-300/40 shadow-md"
            />
            <div>
              <span className="text-lg font-semibold tracking-tight text-white">OptiCo</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
                Optical Clinic
              </span>
            </div>
          </Link>

          {/* Center Mascot & Clinic Card */}
          <div className="relative z-10 my-auto py-6">
            <div className="max-w-md rounded-2xl border border-white/20 bg-black/35 p-7 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src="/mascot.jpg"
                  alt="Dr. Octo"
                  className="size-13 rounded-2xl object-cover ring-2 ring-emerald-400/40 shadow-sm"
                />
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    ✦ Dr. Octo Recommends
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight text-white mt-1">
                    Thoughtfully Scheduled Eye Care
                  </h2>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-white/80">
                Experience a calmer, precision-guided optical consultation. Dedicated schedules for comprehensive exams, contact lens fittings, and frame selections.
              </p>

              <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs text-white/85">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-[10px] text-emerald-300 font-bold">✓</span>
                  <span>Real-time appointment slots with certified optometrists</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-[10px] text-emerald-300 font-bold">✓</span>
                  <span>Scoped clinical portals with role-based access</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-[10px] text-emerald-300 font-bold">✓</span>
                  <span>Instant walk-in queueing & clinic cashiering</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-white/70">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span>OptiCo Clinical Care Network · Makati City</span>
          </div>
        </aside>

        <main className="flex flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">
          <div className="w-full max-w-md space-y-5">
            <Link
              to="/"
              className="flex items-center justify-center gap-2.5 lg:hidden mb-2"
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
              <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline">
                <span>←</span> Back to the clinic site
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
