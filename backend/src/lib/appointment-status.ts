import type { AppointmentStatus } from "@/db/schema";

// Client input never sets status directly; services ask this table first.
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW", "COMPLETED"],
  CHECKED_IN: ["IN_PROGRESS", "CANCELLED", "NO_SHOW", "COMPLETED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export const BLOCKING_STATUSES: AppointmentStatus[] = ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"];

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return APPOINTMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isBlockingStatus(status: AppointmentStatus): boolean {
  return BLOCKING_STATUSES.includes(status);
}

export const DOCTOR_ALLOWED_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  CONFIRMED: ["CHECKED_IN", "NO_SHOW"],
  CHECKED_IN: ["IN_PROGRESS", "COMPLETED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
};

export function canDoctorTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return DOCTOR_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
