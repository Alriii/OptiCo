"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  ChevronsUpDown,
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, portalPathForRole, type Role } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
    <div className="min-h-screen bg-secondary/35 lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:min-h-screen lg:border-r lg:border-sidebar-border">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 lg:py-6">
            <Link href={portal} className="flex items-center gap-3 group">
              <img
                src="/mascot.jpg"
                alt="OptiCo Mascot"
                className="size-10 rounded-xl object-cover ring-1 ring-sidebar-foreground/20 shadow-xs transition-transform group-hover:scale-105"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-base font-bold tracking-tight text-sidebar-foreground">OptiCo</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {ROLE_LABELS[role]} Portal
                </span>
              </span>
            </Link>

            {/* Mobile User Account Dropdown */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="User account menu"
                    className="flex size-9 items-center justify-center rounded-full ring-2 ring-sidebar-foreground/20 transition-all hover:ring-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer"
                  >
                    <Avatar size="sm" className="size-9">
                      <AvatarFallback className="bg-emerald-600/30 text-emerald-200 font-semibold text-xs">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="w-60 rounded-2xl border border-border/80 bg-popover/95 p-2 shadow-xl backdrop-blur-md"
                >
                  <DropdownMenuLabel className="p-2.5 font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-foreground">{user?.name ?? "My Account"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      <div className="pt-1.5">
                        <Badge variant="outline" className="text-xs font-normal">
                          {ROLE_LABELS[role]}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={logout}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive p-2 text-sm"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label={`${ROLE_LABELS[role]} navigation`}
            className="flex gap-1.5 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-4"
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
                    "flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop User Account Pill & Popover Menu */}
        <div className="hidden p-4 lg:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="User account menu"
                className="group flex w-full items-center gap-3.5 rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/30 p-3 text-left transition-all hover:bg-sidebar-accent/70 hover:border-sidebar-border focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer"
              >
                <Avatar size="default" className="size-10 ring-1 ring-sidebar-foreground/20 shrink-0">
                  <AvatarFallback className="bg-emerald-600/30 text-emerald-200 font-semibold text-sm">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-sidebar-foreground group-hover:text-sidebar-accent-foreground">
                    {user?.name ?? "Signed in"}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/70">
                    {user?.email ?? ROLE_LABELS[role]}
                  </p>
                </div>
                <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/40 transition-colors group-hover:text-sidebar-foreground/80" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-60 rounded-2xl border border-border/80 bg-popover/95 p-2 shadow-2xl backdrop-blur-md"
            >
              <DropdownMenuLabel className="p-2.5 font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">{user?.name ?? "Signed in"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <div className="pt-1.5">
                    <Badge variant="outline" className="text-xs font-normal">
                      {ROLE_LABELS[role]}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                variant="destructive"
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive p-2 text-sm"
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p className="mt-3 px-1 text-xs text-sidebar-foreground/50">
            OptiCo Clinic System · Makati City
          </p>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
