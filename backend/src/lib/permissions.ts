import type { UserRole } from "@/db/schema";

export const PERMISSIONS = [
  "appointments.read_own",
  "appointments.read_assigned",
  "appointments.read_all",
  "appointments.request",
  "appointments.approve",
  "appointments.reject",
  "appointments.reschedule",
  "appointments.cancel",
  "appointments.check_in",
  "appointments.complete",
  "walkins.manage",
  "services.manage",
  "doctors.manage",
  "schedules.manage",
  "staff.manage",
  "clinic_settings.manage",
  "audit_logs.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const PATIENT: Permission[] = [
  "appointments.read_own",
  "appointments.request",
  "appointments.reschedule",
  "appointments.cancel",
];

const DOCTOR: Permission[] = [
  "appointments.read_assigned",
  "appointments.check_in",
  "appointments.complete",
];

const RECEPTIONIST: Permission[] = [
  "appointments.read_all",
  "appointments.approve",
  "appointments.reject",
  "appointments.reschedule",
  "appointments.cancel",
  "appointments.check_in",
  "appointments.complete",
  "walkins.manage",
];

const ADMIN: Permission[] = [...PERMISSIONS];

// Single source of truth. Routes and services check permissions, never raw role strings.
export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  PATIENT: new Set(PATIENT),
  DOCTOR: new Set(DOCTOR),
  RECEPTIONIST: new Set(RECEPTIONIST),
  ADMIN: new Set(ADMIN),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function permissionsFor(role: UserRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}
