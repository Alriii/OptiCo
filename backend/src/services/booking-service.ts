import { ENV } from "@/config/env";
import type { Patient, Service } from "@/db/schema";
import { AppError } from "@/lib/http";
import { ageInYears, formatManilaDateTime, isValidManilaDate, manilaDateString } from "@/lib/time";
import { generateOpaqueToken, hashToken } from "@/lib/tokens";
import { AppointmentRepository } from "@/repositories/appointment-repository";
import { GuestTokenRepository } from "@/repositories/guest-token-repository";
import { PatientRepository } from "@/repositories/patient-repository";
import { ServiceRepository } from "@/repositories/service-repository";
import { SettingsRepository } from "@/repositories/settings-repository";
import { recordAudit } from "@/services/audit-service";
import { enqueueEmail } from "@/services/notifications/email-service";
import { assertAlignedSlot, hasScheduleCoverage } from "@/services/scheduling-service";

const appointmentRepository = new AppointmentRepository();
const patientRepository = new PatientRepository();
const serviceRepository = new ServiceRepository();
const guestTokenRepository = new GuestTokenRepository();
const settingsRepository = new SettingsRepository();

export type GuestPatientInput = {
  fullName: string;
  email: string;
  mobile?: string | null;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  guardianContact?: string | null;
};

export type BookingInput = {
  serviceId: string;
  startAt: string;
  note?: string | null;
  patient?: GuestPatientInput;
};

function validateGuardian(patient: GuestPatientInput, startAt: Date) {
  if (!patient.dateOfBirth) return;
  if (!isValidManilaDate(patient.dateOfBirth)) throw new AppError(400, "Date of birth is invalid");

  const age = ageInYears(patient.dateOfBirth, manilaDateString(startAt));
  if (age < 18) {
    if (!patient.guardianName || !patient.guardianRelationship || !patient.guardianContact) {
      throw new AppError(400, "A parent or guardian is required for patients under 18");
    }
  }
}

async function loadBookableService(serviceId: string): Promise<Service> {
  const service = await serviceRepository.findById(serviceId);
  if (!service || !service.isActive) throw new AppError(404, "Service not found");
  return service;
}

async function validateSlot(service: Service, startAt: Date, patient: GuestPatientInput) {
  if (Number.isNaN(startAt.getTime())) throw new AppError(400, "Requested time is invalid");
  if (startAt.getTime() <= Date.now()) throw new AppError(400, "Requested time must be in the future");
  assertAlignedSlot(startAt);
  validateGuardian(patient, startAt);

  const covered = await hasScheduleCoverage(service, startAt);
  if (!covered) throw new AppError(409, "No doctor schedule covers that time. Please choose another slot.");
}

async function notifyRequestReceived(appointmentId: string, reference: string, serviceName: string, patient: Patient, startAt: Date, doctorName = "") {
  const settings = await settingsRepository.get();
  const clinicName = settings?.name ?? "OptiCo";
  const when = formatManilaDateTime(startAt);

  await enqueueEmail({
    dedupeKey: `request_received:${appointmentId}`,
    recipient: patient.email,
    templateKey: "request_received",
    payload: { patientName: patient.fullName, reference, serviceName, when, clinicName },
  });

  if (settings?.email) {
    await enqueueEmail({
      dedupeKey: `staff_pending:${appointmentId}`,
      recipient: settings.email,
      templateKey: "staff_pending_alert",
      payload: { reference, patientName: patient.fullName, serviceName, when, clinicName, doctorName },
    });
  }
}

export async function createGuestBookingService(input: BookingInput) {
  if (!input.patient) throw new AppError(400, "Patient details are required");
  const service = await loadBookableService(input.serviceId);
  const startAt = new Date(input.startAt);
  await validateSlot(service, startAt, input.patient);

  const patient = await patientRepository.create(input.patient);
  const appointment = await appointmentRepository.create({
    patientId: patient.id,
    serviceId: service.id,
    source: "ONLINE_GUEST",
    requestedStartAt: startAt,
    durationMinutes: service.durationMinutes,
    fee: service.fee,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    note: input.note ?? null,
  });

  const settings = await settingsRepository.get();
  const ttlHours = settings?.guestLinkTtlHours ?? ENV.GUEST_LINK_TTL_HOURS;
  const rawToken = generateOpaqueToken(32);
  await guestTokenRepository.create({
    appointmentId: appointment.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
  });

  await enqueueEmail({
    dedupeKey: `guest_link:${appointment.id}`,
    recipient: patient.email,
    templateKey: "guest_link",
    payload: {
      reference: appointment.reference,
      link: `${ENV.APP_PUBLIC_URL}/guest/manage#token=${rawToken}`,
      ttlHours,
    },
  });

  await notifyRequestReceived(appointment.id, appointment.reference, service.name, patient, startAt);
  await recordAudit({
    actorType: "GUEST",
    action: "appointment.requested",
    entityType: "appointment",
    entityId: appointment.id,
    metadata: { source: "ONLINE_GUEST", reference: appointment.reference },
  });

  return {
    id: appointment.id,
    reference: appointment.reference,
    status: appointment.status,
    requestedStartAt: appointment.requestedStartAt.toISOString(),
    serviceName: service.name,
  };
}

export async function createPatientBookingService(userId: string, input: BookingInput) {
  const service = await loadBookableService(input.serviceId);
  const startAt = new Date(input.startAt);

  const patient = await patientRepository.findByUserId(userId);
  if (!patient) throw new AppError(400, "Patient profile is missing. Contact the clinic.");
  await validateSlot(service, startAt, {
    fullName: patient.fullName,
    email: patient.email,
    dateOfBirth: patient.dateOfBirth,
    guardianName: patient.guardianName,
    guardianRelationship: patient.guardianRelationship,
    guardianContact: patient.guardianContact,
  });

  const appointment = await appointmentRepository.create({
    patientId: patient.id,
    serviceId: service.id,
    source: "ONLINE_ACCOUNT",
    requestedStartAt: startAt,
    durationMinutes: service.durationMinutes,
    fee: service.fee,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    note: input.note ?? null,
    createdByUserId: userId,
  });

  await notifyRequestReceived(appointment.id, appointment.reference, service.name, patient, startAt);
  await recordAudit({
    actorUserId: userId,
    action: "appointment.requested",
    entityType: "appointment",
    entityId: appointment.id,
    metadata: { source: "ONLINE_ACCOUNT", reference: appointment.reference },
  });

  return {
    id: appointment.id,
    reference: appointment.reference,
    status: appointment.status,
    requestedStartAt: appointment.requestedStartAt.toISOString(),
    serviceName: service.name,
  };
}

export function toGuestAppointmentView(appointment: {
  id: string;
  reference: string;
  status: string;
  requestedStartAt: Date;
  startsAt: Date | null;
  endsAt: Date | null;
  serviceName: string;
  doctorName: string | null;
  fee: string;
  note: string | null;
}) {
  return {
    id: appointment.id,
    reference: appointment.reference,
    status: appointment.status,
    requestedStartAt: appointment.requestedStartAt.toISOString(),
    startsAt: appointment.startsAt?.toISOString() ?? null,
    endsAt: appointment.endsAt?.toISOString() ?? null,
    serviceName: appointment.serviceName,
    doctorName: appointment.doctorName,
    fee: appointment.fee,
    note: appointment.note,
  };
}
