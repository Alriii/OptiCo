import Link from "next/link";
import { AuthGuard } from "@/components/features/auth/AuthGuard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
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
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80 lg:hidden">
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
              href="/"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to clinic
            </Link>
          </div>

          {/* Form Children */}
          <div className="mx-auto my-auto w-full max-w-[360px] py-10">
            {children}
          </div>

          {/* Bottom Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground/60">
            <span>© 2026 OptiCo Clinic</span>
            <div className="flex items-center gap-4">
              <Link href="/policies/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/policies/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
