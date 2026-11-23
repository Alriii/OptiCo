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
    <div className="min-h-screen bg-secondary/40 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:min-h-screen lg:border-r lg:border-sidebar-border">
        <div>
          <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
            <Link href={portal} className="flex items-center gap-2.5">
              <img
                src="/mascot.jpg"
                alt="OptiCo Mascot"
                className="size-9 rounded-full object-cover ring-2 ring-sidebar-foreground/20 shadow-xs"
              />
              <span className="flex flex-col leading-none">
                <span className="text-base font-semibold">OptiCo</span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/70">
                  {ROLE_LABELS[role]} portal
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
                    className="flex size-8 items-center justify-center rounded-full ring-2 ring-sidebar-foreground/20 transition-all hover:ring-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer"
                  >
                    <Avatar size="sm" className="size-8">
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
                  className="w-56 rounded-2xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md"
                >
                  <DropdownMenuLabel className="p-2 font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-semibold leading-none text-foreground">{user?.name ?? "My Account"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                      <div className="pt-1">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {ROLE_LABELS[role]}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={logout}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop User Account Pill & Accessible Popover Menu */}
        <div className="hidden p-3.5 lg:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="User account menu"
                className="group flex w-full items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/30 p-2.5 text-left transition-all hover:bg-sidebar-accent/70 hover:border-sidebar-border focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer"
              >
                <Avatar size="default" className="size-9 ring-1 ring-sidebar-foreground/20 shrink-0">
                  <AvatarFallback className="bg-emerald-600/30 text-emerald-200 font-semibold text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-sidebar-foreground group-hover:text-sidebar-accent-foreground">
                    {user?.name ?? "Signed in"}
                  </p>
                  <p className="truncate text-[11px] text-sidebar-foreground/60">
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
              className="w-56 rounded-2xl border border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md"
            >
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-foreground">{user?.name ?? "Signed in"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <div className="pt-1.5">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {ROLE_LABELS[role]}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                variant="destructive"
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p className="mt-2.5 px-1 text-[10px] text-sidebar-foreground/50">
            OptiCo Clinic System · Makati City
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
