import Link from "next/link";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { DEMO_NOTICE } from "@/lib/demo-clinic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard guestOnly>
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <Link href="/" className="flex items-center gap-2">
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
              href="/"
              className="flex items-center justify-center gap-2 lg:hidden"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                O
              </span>
              <span className="text-lg font-semibold">OptiCo</span>
            </Link>
            {children}
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/" className="underline underline-offset-4">
                Back to the clinic site
              </Link>
            </p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
