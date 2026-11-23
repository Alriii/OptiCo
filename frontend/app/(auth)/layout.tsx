import Link from "next/link";
import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { DEMO_NOTICE } from "@/lib/demo-clinic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard guestOnly>
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#162a24] via-[#1f3b33] to-[#12221d] p-8 text-primary-foreground xl:p-12 lg:flex">
          {/* Subtle ambient light rings */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full bg-teal-500/10 blur-3xl" />

          {/* Top Logo */}
          <Link href="/" className="relative z-10 flex items-center gap-3">
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
              href="/"
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
            {children}
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/" className="underline underline-offset-4 hover:text-foreground">
                ← Back to the clinic site
              </Link>
            </p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
