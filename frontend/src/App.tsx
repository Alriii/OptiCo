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
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Column: Optical Clinic Visual Experience with Photography (Desktop Only) */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-12 xl:p-16 text-white border-r border-border/20">
          {/* High-Resolution Optical Photography Backdrop */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1600&q=85"
              alt="OptiCo Eyewear & Clinical Diagnostics"
              className="size-full object-cover object-center"
              loading="eager"
            />
            {/* Sophisticated Dark Gradient Vignette Overlay for Crisp Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#061814]/95 via-[#061814]/65 to-[#061814]/75" />
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <img
                src="/mascot.jpg"
                alt="OptiCo Mascot"
                className="size-9 rounded-lg object-cover ring-1 ring-white/20 shadow-sm"
              />
              <div>
                <span className="text-base font-semibold tracking-tight text-white">OptiCo</span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-300/80">
                  Optical Clinic
                </span>
              </div>
            </Link>
            <span className="text-xs text-white/50 font-normal">Makati City, Philippines</span>
          </div>

          {/* Center Editorial Statement */}
          <div className="relative z-10 max-w-lg space-y-4">
            <blockquote className="text-2xl xl:text-3xl font-light tracking-tight leading-snug text-white/95">
              “Precision in every prescription. Thoughtful care in every consultation.”
            </blockquote>
            <p className="text-sm font-normal text-white/70 leading-relaxed">
              A modern optical health platform uniting certified optometrists, clinical staff, and patients with real-time scheduling, ocular diagnostics, and bespoke eyewear fittings.
            </p>
          </div>

          {/* Bottom Clinical Metadata */}
          <div className="relative z-10 flex items-center justify-between text-xs text-white/45">
            <span>Optical Health & Vision Care</span>
            <span>Accredited Clinical Network</span>
          </div>
        </div>

        {/* Right Column: Focused Minimalist Form */}
        <div className="flex min-h-screen flex-col justify-between bg-background p-6 sm:p-10 lg:p-12 xl:p-16">
          {/* Top Header Navigation (Mobile logo, Desktop back link) */}
          <div className="flex items-center justify-between lg:justify-end">
            <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80 lg:hidden">
              <img
                src="/mascot.jpg"
                alt="OptiCo Mascot"
                className="size-7 rounded-lg object-cover ring-1 ring-border/80 shadow-2xs"
              />
              <span className="text-base font-semibold tracking-tight text-foreground">
                OptiCo
              </span>
            </Link>
            <Link
              to="/"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to clinic
            </Link>
          </div>

          {/* Form Outlet */}
          <div className="mx-auto my-auto w-full max-w-[360px] py-10">
            <Outlet />
          </div>

          {/* Bottom Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground/60">
            <span>© 2026 OptiCo Clinic</span>
            <div className="flex items-center gap-4">
              <Link to="/policies/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/policies/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Support</Link>
            </div>
          </div>
        </div>
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
