"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { portalPathForRole } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/doctors", label: "Doctors" },
  { href: "/booking", label: "Book a visit" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="OptiCo home">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            O
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">OptiCo</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Optical Clinic
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary",
                  active ? "font-medium text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" variant="outline">
              <Link href={portalPathForRole(user.role)}>My portal</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          <details className="relative md:hidden">
            <summary
              className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border bg-popover p-1 shadow-lg">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
