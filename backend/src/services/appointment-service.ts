import { db } from "@/db";
import type { Appointment, AppointmentStatus, Service } from "@/db/schema";
import { canDoctorTransition, canTransition } from "@/lib/appointment-status";
import { AppError } from "@/lib/http";
import { formatManilaDateTime, manilaDateString } from "@/lib/time";
import { AppointmentRepository, type AppointmentFilters } from "@/repositories/appointment-repository";
import { DoctorRepository } from "@/repositories/doctor-repository";
import { EmailOutboxRepository } from "@/repositories/email-outbox-repository";
import { GuestTokenRepository } from "@/repositories/guest-token-repository";
import { PatientRepository } from "@/repositories/patient-repository";
import { ServiceRepository } from "@/repositories/service-repository";
import { SettingsRepository } from "@/repositories/settings-repository";
import { recordAudit } from "@/services/audit-service";
import { enqueueEmail } from "@/services/notifications/email-service";
import { assertAlignedSlot, assignDoctor, hasScheduleCoverage } from "@/services/scheduling-service";

const appointmentRepository = new AppointmentRepository();
const serviceRepository = new ServiceRepository();
const doctorRepository = new DoctorRepository();
const patientRepository = new PatientRepository();
const outboxRepository = new EmailOutboxRepository();
const settingsRepository = new SettingsRepository();
const guestTokenRepository = new GuestTokenRepository();

function isExclusionViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === "23P01";
}

function asConflict(error: unknown): never {
  if (isExclusionViolation(error)) {
    throw new AppError(409, "That slot was just taken. Please choose another time.");
  }
  throw error;
}

async function patientEmailContext(appointmentId: string) {
  return appointmentRepository.findDetailById(appointmentId);
}

async function notifyPatient(
  detail: Awaited<ReturnType<typeof patientEmailContext>>,
  templateKey: string,
  extra: Record<string, unknown> = {},
) {
  if (!detail?.patientEmail) return;
  const settings = await settingsRepository.get();
  const when = formatManilaDateTime(detail.startsAt ?? detail.requestedStartAt);
  const stamp = (detail.startsAt ?? detail.requestedStartAt).toISOString();

  await enqueueEmail({
    dedupeKey: `${templateKey}:${detail.id}:${stamp}`,
    recipient: detail.patientEmail,
    templateKey,
    payload: {
      patientName: detail.patientName,
      reference: detail.reference,
      serviceName: detail.serviceName,
      doctorName: detail.doctorName ?? "",
      when,
      clinicName: settings?.name ?? "OptiCo",
      ...extra,
    },
  });
}

async function scheduleReminders(detail: Awaited<ReturnType<typeof patientEmailContext>>) {
  if (!detail?.startsAt || !detail.patientEmail) return;
  const now = Date.now();
  const startsAt = detail.startsAt.getTime();
  const settings = await settingsRepository.get();

  const reminders: { key: string; template: string; leadMs: number }[] = [
    { key: "reminder24h", template: "reminder_24h", leadMs: 24 * 60 * 60 * 1000 },
    { key: "reminder2h", template: "reminder_2h", leadMs: 2 * 60 * 60 * 1000 },
  ];

  for (const reminder of reminders) {
    const deliverAfter = new Date(startsAt - reminder.leadMs);
    if (deliverAfter.getTime() <= now) continue;
    await enqueueEmail({
      dedupeKey: `${reminder.key}:${detail.id}:${detail.startsAt.toISOString()}`,
      recipient: detail.patientEmail,
      templateKey: reminder.template,
      deliverAfter,
      payload: {
        patientName: detail.patientName,
        reference: detail.reference,
        serviceName: detail.serviceName,
        doctorName: detail.doctorName ?? "",
        when: formatManilaDateTime(detail.startsAt),
        clinicName: settings?.name ?? "OptiCo",
      },
    });
  }
}

function snapshotService(service: Service, appointment: Appointment): Service {
  return {
    ...service,
    durationMinutes: appointment.durationMinutes,
    bufferBeforeMinutes: appointment.bufferBeforeMinutes,
    bufferAfterMinutes: appointment.bufferAfterMinutes,
  };
}

async function requireService(serviceId: string) {
  const service = await serviceRepository.findById(serviceId);
  if (!service) throw new AppError(404, "Service not found");
  return service;
}

export async function listStaffAppointmentsService(filters: AppointmentFilters, page: number, limit: number) {
  return appointmentRepository.list(filters, page, limit);
}

export async function getStaffAppointmentService(id: string) {
  const detail = await appointmentRepository.findDetailById(id);
  if (!detail) throw new AppError(404, "Appointment not found");
  return detail;
}

export async function listPatientAppointmentsService(userId: string, page: number, limit: number) {
  const patient = await patientRepository.findByUserId(userId);
  if (!patient) throw new AppError(404, "Patient profile not found");
  return appointmentRepository.listForPatient(patient.id, page, limit);
}

export async function getPatientAppointmentService(userId: string, id: string) {
  const patient = await patientRepository.findByUserId(userId);
  if (!patient) throw new AppError(404, "Patient profile not found");
  const detail = await appointmentRepository.findDetailById(id);
  if (!detail || detail.patientId !== patient.id) throw new AppError(404, "Appointment not found");
  return detail;
}

export async function listDoctorAppointmentsService(
  userId: string,
  filters: Omit<AppointmentFilters, "doctorId">,
  page: number,
  limit: number,
) {
  const doctor = await doctorRepository.findByUserId(userId);
  if (!doctor) throw new AppError(403, "Doctor profile not found");
  return appointmentRepository.listForDoctor(doctor.id, filters, page, limit);
}

export async function getDoctorAppointmentService(userId: string, id: string) {
  const doctor = await doctorRepository.findByUserId(userId);
  if (!doctor) throw new AppError(403, "Doctor profile not found");
  const detail = await appointmentRepository.findDetailById(id);
  if (!detail || detail.doctorId !== doctor.id) throw new AppError(404, "Appointment not found");
  return detail;
}

export async function approveAppointmentService(id: string, actorUserId: string) {
  try {
    await db.transaction(async (tx) => {
      const appointment = await appointmentRepository.findByIdForUpdate(id, tx);
      if (!appointment) throw new AppError(404, "Appointment not found");
      if (!canTransition(appointment.status, "CONFIRMED")) {
        throw new AppError(409, "Only pending requests can be approved");
      }

      const service = await requireService(appointment.serviceId);
      if (!service.isActive) throw new AppError(409, "This service is no longer available");
      const startAt = appointment.requestedStartAt;
      const doctorId = await assignDoctor(snapshotService(service, appointment), startAt, tx);
      if (!doctorId) {
        throw new AppError(409, "No doctor is available for that time. Choose another slot or reject the request.");
      }

      await appointmentRepository.update(
        id,
        {
          status: "CONFIRMED",
          doctorId,
          startsAt: startAt,
          endsAt: new Date(startAt.getTime() + appointment.durationMinutes * 60_000),
          approvedByUserId: actorUserId,
          approvedAt: new Date(),
        },
        tx,
      );
      await appointmentRepository.addHistory(
        { appointmentId: id, fromStatus: "PENDING", toStatus: "CONFIRMED", actorUserId, reason: "Approved" },
        tx,
      );
      await outboxRepository.cancelUnsentReminders(id, tx);
    });
  } catch (error) {
    asConflict(error);
  }

  const detail = await patientEmailContext(id);
  await notifyPatient(detail, "approved");
  await scheduleReminders(detail);
  await recordAudit({
    actorUserId,
    action: "appointment.approved",
    entityType: "appointment",
    entityId: id,
    metadata: { reference: detail?.reference, doctorId: detail?.doctorId },
  });
  return detail;
}

export async function rejectAppointmentService(id: string, actorUserId: string, reason: string) {
  await db.transaction(async (tx) => {
    const appointment = await appointmentRepository.findByIdForUpdate(id, tx);
    if (!appointment) throw new AppError(404, "Appointment not found");
    if (!canTransition(appointment.status, "REJECTED")) throw new AppError(409, "This request cannot be rejected");

    await appointmentRepository.update(
      id,
      { status: "REJECTED", rejectedAt: new Date(), cancellationReason: reason },
      tx,
    );
    await appointmentRepository.addHistory(
      { appointmentId: id, fromStatus: "PENDING", toStatus: "REJECTED", actorUserId, reason },
      tx,
    );
  });

  const detail = await patientEmailContext(id);
  await notifyPatient(detail, "rejected", { reason });
  await recordAudit({
    actorUserId,
    action: "appointment.rejected",
    entityType: "appointment",
    entityId: id,
    metadata: { reference: detail?.reference },
  });
  return detail;
}

export async function cancelAppointmentService(id: string, actorUserId: string, reason: string) {
  await db.transaction(async (tx) => {
    const appointment = await appointmentRepository.findByIdForUpdate(id, tx);
    if (!appointment) throw new AppError(404, "Appointment not found");
    if (!canTransition(appointment.status, "CANCELLED")) throw new AppError(409, "This appointment cannot be cancelled");

    await appointmentRepository.update(
      id,
      { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason },
      tx,
    );
    await appointmentRepository.addHistory(
      { appointmentId: id, fromStatus: appointment.status, toStatus: "CANCELLED", actorUserId, reason },
      tx,
    );
    await outboxRepository.cancelUnsentReminders(id, tx);
  });

  await guestTokenRepository.revokeForAppointment(id);
  const detail = await patientEmailContext(id);
  await notifyPatient(detail, "cancelled", { reason });
  await recordAudit({
    actorUserId,
    action: "appointment.cancelled",
    entityType: "appointment",
    entityId: id,
    metadata: { reference: detail?.reference },
  });
  return detail;
}

export async function rescheduleAppointmentService(id: string, actorUserId: string, startAt: Date) {
  if (Number.isNaN(startAt.getTime())) throw new AppError(400, "New time is invalid");
  if (startAt.getTime() <= Date.now()) throw new AppError(400, "New time must be in the future");
  assertAlignedSlot(startAt);

  try {
    await db.transaction(async (tx) => {
      const appointment = await appointmentRepository.findByIdForUpdate(id, tx);
      if (!appointment) throw new AppError(404, "Appointment not found");
      if (appointment.status !== "CONFIRMED") {
        throw new AppError(409, "Only confirmed appointments can be rescheduled");
      }

      const service = await requireService(appointment.serviceId);
      const doctorId = await assignDoctor(snapshotService(service, appointment), startAt, tx);
      if (!doctorId) throw new AppError(409, "No doctor is available for that time");

      await appointmentRepository.update(
        id,
        {
          doctorId,
          requestedStartAt: startAt,
          startsAt: startAt,
          endsAt: new Date(startAt.getTime() + appointment.durationMinutes * 60_000),
        },
        tx,
      );
      await appointmentRepository.addHistory(
        { appointmentId: id, fromStatus: "CONFIRMED", toStatus: "CONFIRMED", actorUserId, reason: "Rescheduled" },
        tx,
      );
      await outboxRepository.cancelUnsentReminders(id, tx);
    });
  } catch (error) {
    asConflict(error);
  }

  const detail = await patientEmailContext(id);
  await notifyPatient(detail, "rescheduled");
  await scheduleReminders(detail);
  await recordAudit({
    actorUserId,
    action: "appointment.rescheduled",
    entityType: "appointment",
    entityId: id,
    metadata: { reference: detail?.reference, startsAt: detail?.startsAt?.toISOString() },
  });
  return detail;
}

async function simpleTransition(
  id: string,
  actorUserId: string,
  to: AppointmentStatus,
  action: string,
  extra: Partial<typeof import("@/db/schema").appointments.$inferInsert> = {},
) {
  await db.transaction(async (tx) => {
    const appointment = await appointmentRepository.findByIdForUpdate(id, tx);
    if (!appointment) throw new AppError(404, "Appointment not found");
    if (!canTransition(appointment.status, to)) {
      throw new AppError(409, `Cannot move appointment from ${appointment.status} to ${to}`);
    }
    await appointmentRepository.update(id, { status: to, ...extra }, tx);
    await appointmentRepository.addHistory(
      { appointmentId: id, fromStatus: appointment.status, toStatus: to, actorUserId },
      tx,
    );
  });

  const detail = await patientEmailContext(id);
  await recordAudit({ actorUserId, action, entityType: "appointment", entityId: id, metadata: { reference: detail?.reference } });
  return detail;
}

export const checkInAppointmentService = (id: string, actorUserId: string) =>
  simpleTransition(id, actorUserId, "CHECKED_IN", "appointment.checked_in");

export const completeAppointmentService = (id: string, actorUserId: string) =>
  simpleTransition(id, actorUserId, "COMPLETED", "appointment.completed");

export const noShowAppointmentService = (id: string, actorUserId: string) =>
  simpleTransition(id, actorUserId, "NO_SHOW", "appointment.no_show");

export async function doctorStatusChangeService(
  userId: string,
  id: string,
  to: AppointmentStatus,
  reason?: string,
) {
  const doctor = await doctorRepository.findByUserId(userId);
  if (!doctor) throw new AppError(403, "Doctor profile not found");

  await db.transaction(async (tx) => {
    const appointment = await appointmentRepository.findByIdForUpdate(id, tx);
    if (!appointment || appointment.doctorId !== doctor.id) throw new AppError(404, "Appointment not found");
    if (!canDoctorTransition(appointment.status, to)) {
      throw new AppError(409, `Cannot move appointment from ${appointment.status} to ${to}`);
    }
    await appointmentRepository.update(id, { status: to }, tx);
    await appointmentRepository.addHistory(
      { appointmentId: id, fromStatus: appointment.status, toStatus: to, actorUserId: userId, reason },
      tx,
    );
  });

  await recordAudit({
    actorUserId: userId,
    action: "appointment.doctor_status_changed",
    entityType: "appointment",
    entityId: id,
    metadata: { to },
  });
  return patientEmailContext(id);
}

async function assertCancellationPolicy(appointment: Appointment) {
  if (appointment.status === "PENDING") return;
  if (appointment.status !== "CONFIRMED" || !appointment.startsAt) {
    throw new AppError(409, "This appointment cannot be cancelled online. Please contact the clinic.");
  }
  const settings = await settingsRepository.get();
  const cutoffMs = (settings?.cancellationCutoffHours ?? 24) * 60 * 60 * 1000;
  if (appointment.startsAt.getTime() - Date.now() < cutoffMs) {
    throw new AppError(409, "This appointment is inside the cancellation cutoff. Please contact the clinic.");
  }
}

export async function patientCancelRequestService(userId: string, id: string, reason: string) {
  const patient = await patientRepository.findByUserId(userId);
  if (!patient) throw new AppError(404, "Patient profile not found");
  const appointment = await appointmentRepository.findById(id);
  if (!appointment || appointment.patientId !== patient.id) throw new AppError(404, "Appointment not found");
  await assertCancellationPolicy(appointment);
  return cancelAppointmentService(id, userId, reason);
}

export async function guestCancelRequestService(appointmentId: string, reason: string) {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) throw new AppError(404, "Appointment not found");
  await assertCancellationPolicy(appointment);
  return cancelAppointmentService(appointmentId, "", reason || "Guest requested cancellation");
}

export async function patientRescheduleRequestService(userId: string, id: string, startAt: Date) {
  const patient = await patientRepository.findByUserId(userId);
  if (!patient) throw new AppError(404, "Patient profile not found");
  const appointment = await appointmentRepository.findById(id);
  if (!appointment || appointment.patientId !== patient.id) throw new AppError(404, "Appointment not found");
  if (appointment.status !== "PENDING") {
    throw new AppError(409, "Confirmed appointments are rescheduled by clinic staff. Please contact the clinic.");
  }
  if (Number.isNaN(startAt.getTime()) || startAt.getTime() <= Date.now()) {
    throw new AppError(400, "New time must be in the future");
  }
  assertAlignedSlot(startAt);

  const service = await requireService(appointment.serviceId);
  if (!(await hasScheduleCoverage(snapshotService(service, appointment), startAt))) {
    throw new AppError(409, "No doctor schedule covers that time");
  }

  await appointmentRepository.update(id, { requestedStartAt: startAt });
  await recordAudit({
    actorUserId: userId,
    action: "appointment.reschedule_requested",
    entityType: "appointment",
    entityId: id,
    metadata: { reference: appointment.reference, startsAt: startAt.toISOString() },
  });

  const settings = await settingsRepository.get();
  if (settings?.email) {
    await enqueueEmail({
      dedupeKey: `staff_reschedule:${id}:${startAt.toISOString()}`,
      recipient: settings.email,
      templateKey: "reschedule_requested",
      payload: {
        reference: appointment.reference,
        serviceName: service.name,
        when: formatManilaDateTime(startAt),
      },
    });
  }

  return appointmentRepository.findDetailById(id);
}

/** Used by the guest controller after the cookie has been verified. */
export async function getGuestAppointmentService(appointmentId: string) {
  const detail = await appointmentRepository.findDetailById(appointmentId);
  if (!detail) throw new AppError(404, "Appointment not found");
  return detail;
}

export function manilaDateOf(date: Date) {
  return manilaDateString(date);
}
