"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Clock,
  FileClock,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings,
  Stethoscope,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, portalPathForRole, type Role } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_BY_ROLE: Record<Role, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  PATIENT: [
    { href: "/patient", label: "Overview", icon: LayoutDashboard },
    { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/patient/profile", label: "Profile", icon: UserRound },
  ],
  DOCTOR: [
    { href: "/doctor", label: "Today", icon: LayoutDashboard },
    { href: "/doctor/schedule", label: "Schedule", icon: CalendarRange },
    { href: "/doctor/availability", label: "Availability", icon: Clock },
  ],
  RECEPTIONIST: [
    { href: "/staff", label: "Request queue", icon: ClipboardList },
    { href: "/staff/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/staff/calendar", label: "Calendar", icon: CalendarRange },
    { href: "/staff/walk-ins", label: "Walk-ins", icon: ListOrdered },
    { href: "/staff/payments", label: "Payments", icon: Wallet },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { href: "/admin/staff", label: "Staff", icon: UsersRound },
    { href: "/admin/services", label: "Services", icon: Activity },
    { href: "/admin/schedules", label: "Schedules", icon: CalendarRange },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/audit-logs", label: "Audit logs", icon: FileClock },
  ],
};

interface PortalShellProps {
  role: Role;
  children: React.ReactNode;
}

export function PortalShell({ role, children }: PortalShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const portal = portalPathForRole(role);
  const nav = NAV_BY_ROLE[role];

  return (
    <div className="min-h-screen bg-secondary/40 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b bg-sidebar text-sidebar-foreground lg:min-h-screen lg:border-r lg:border-sidebar-border">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:flex-col lg:items-start lg:gap-6 lg:py-6">
          <Link href={portal} className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              O
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-semibold">OptiCo</span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/70">
                {ROLE_LABELS[role]} portal
              </span>
            </span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>

        <nav
          aria-label={`${ROLE_LABELS[role]} navigation`}
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3"
        >
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== portal && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden px-5 py-4 lg:block">
          <div className="rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-3 text-xs">
            <p className="font-medium">{user?.name ?? "Signed in"}</p>
            <p className="truncate text-sidebar-foreground/70">{user?.email}</p>
            <Badge
              variant="outline"
              className="mt-2 border-sidebar-border text-sidebar-foreground"
            >
              {ROLE_LABELS[role]}
            </Badge>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-sidebar-foreground/60">
            Demo clinic workspace. Sample data only.
          </p>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
