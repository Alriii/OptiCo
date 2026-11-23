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
          <Link href="/" className="relative z-10 flex items-center gap-3">
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
            <div className="max-w-md rounded-3xl border border-white/15 bg-black/30 p-7 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src="/mascot.jpg"
                  alt="Dr. Octo"
                  className="size-14 rounded-2xl object-cover ring-2 ring-emerald-400/40 shadow-sm"
                />
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    ✦ Dr. Octo Recommends
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight text-white mt-0.5">
                    Thoughtfully Scheduled Eye Care
                  </h2>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-white/80">
                Experience a calmer, precision-guided optical consultation. Dedicated schedules for comprehensive exams, contact lens fittings, and frame selections.
              </p>

              <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-white/85">
                <div className="flex items-center gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-[10px] text-emerald-300 font-bold">✓</span>
                  <span>Real-time appointment slots with certified optometrists</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-[10px] text-emerald-300 font-bold">✓</span>
                  <span>Scoped portals for Patients, Doctors, Staff & Admins</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-[10px] text-emerald-300 font-bold">✓</span>
                  <span>Instant walk-in queueing & clinic cashiering</span>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 max-w-sm text-xs leading-relaxed text-white/60">
            {DEMO_NOTICE}
          </p>
        </aside>

        <main className="flex flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">
          <div className="w-full max-w-md space-y-5">
            <Link
              href="/"
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
