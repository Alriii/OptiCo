import Link from "next/link";
import { CLINIC_PROFILE } from "@/lib/demo-clinic";

const POLICY_LINKS = [
  { href: "/policies/privacy", label: "Privacy notice" },
  { href: "/policies/terms", label: "Terms of use" },
  { href: "/policies/cancellation", label: "Cancellation policy" },
];

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t bg-secondary/60">
      <div className="page-shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/mascot.jpg"
              alt="OptiCo Mascot"
              className="size-8 rounded-full object-cover ring-1 ring-border shadow-xs"
            />
            <p className="text-lg font-semibold tracking-tight">OptiCo</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Appointment requests and clinic operations for a calmer optical
            care visit.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Visit</p>
          <p className="text-muted-foreground">{CLINIC_PROFILE.address}</p>
          <p className="text-muted-foreground">{CLINIC_PROFILE.phone}</p>
          <p className="text-muted-foreground">{CLINIC_PROFILE.email}</p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Explore</p>
          <Link href="/services" className="block text-muted-foreground hover:text-foreground">
            Services
          </Link>
          <Link href="/doctors" className="block text-muted-foreground hover:text-foreground">
            Doctors
          </Link>
          <Link href="/booking" className="block text-muted-foreground hover:text-foreground">
            Book a visit
          </Link>
          <Link href="/guest/manage" className="block text-muted-foreground hover:text-foreground">
            Manage a guest booking
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Policies</p>
          {POLICY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t">
        <div className="page-shell flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OptiCo Optical Clinic & Diagnostic Studio. All rights reserved.</p>
          <p>Makati City, Metro Manila · Asia/Manila (PHT)</p>
        </div>
      </div>
    </footer>
  );
}
