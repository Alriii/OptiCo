import type { Role } from "@/lib/auth-redirect";

export type { Role };

export interface ApiEnvelope<T> {
  status: "success" | "error";
  message?: string;
  data: T;
}

export type ListPayload<T> =
  | T[]
  | {
      items?: T[];
      total?: number;
      page?: number;
      [key: string]: unknown;
    };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  patientId?: string | null;
  doctorId?: string | null;
  emailVerified?: boolean;
}

export interface ClinicHour {
  weekday: number | string;
  open: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface ClinicInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: ClinicHour[];
  timezone?: string;
  currency?: string;
}

export interface Service {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  fee?: number | string;
  active?: boolean;
  displayOrder?: number;
}

export interface Doctor {
  id: string;
  slug?: string;
  name: string;
  title?: string;
  credentials?: string;
  bio?: string;
  photoUrl?: string;
  active?: boolean;
  services?: Service[];
}

export interface AvailabilitySlot {
  startAt: string;
  label: string;
}

export interface AvailabilityResponse {
  date: string;
  timezone?: string;
  slots: AvailabilitySlot[];
}

export interface Guardian {
  name: string;
  relationship: string;
  contact: string;
}

export interface Appointment {
  id: string;
  reference?: string;
  status: string;
  source?: string;
  serviceId?: string;
  serviceName?: string;
  service?: Service;
  doctorId?: string | null;
  doctorName?: string | null;
  doctor?: Doctor | null;
  patientName?: string;
  patientEmail?: string;
  patientMobile?: string;
  patientDateOfBirth?: string;
  requestedStartAt?: string;
  startsAt?: string;
  endsAt?: string;
  durationMinutes?: number;
  fee?: number | string;
  paymentStatus?: string;
  note?: string;
  guardian?: Guardian | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentListMeta {
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  guardianContact?: string | null;
}

export interface WalkIn {
  id: string;
  queueNumber?: number | string;
  status: string;
  patientName?: string;
  patientMobile?: string;
  serviceName?: string;
  doctorName?: string | null;
  appointmentId?: string | null;
  createdAt?: string;
  calledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface Payment {
  id: string;
  appointmentId: string;
  appointmentReference?: string;
  amount: number | string;
  currency?: string;
  method: string;
  receiptNumber?: string | null;
  paidAt?: string;
  recordedBy?: string;
  note?: string | null;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  status: string;
  createdAt?: string;
}

export interface DoctorAvailability {
  weekday: number | string;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

export interface ScheduleException {
  id: string;
  date?: string;
  startAt?: string;
  endAt?: string;
  type: string;
  reason?: string;
}

export interface ClinicClosure {
  id: string;
  date: string;
  reason?: string;
}

export interface ClinicSettings {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  cancellationCutoffHours?: number;
  bookingNoticeHours?: number;
  policies?: {
    privacy?: string;
    terms?: string;
    cancellation?: string;
  };
  [key: string]: unknown;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorType?: string;
  actorName?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AdminOverview {
  pendingAppointments?: number;
  confirmedToday?: number;
  walkInsWaiting?: number;
  doctorsActive?: number;
  unpaidAppointments?: number;
  [key: string]: unknown;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface StaffAppointmentParams extends PaginationParams {
  status?: string;
  date?: string;
}

export interface AuditLogParams extends PaginationParams {
  action?: string;
  date?: string;
}
