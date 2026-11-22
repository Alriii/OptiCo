import { eq } from "drizzle-orm";
import { db } from "@/db";
import { walkInQueueEntries, type WalkInStatus } from "@/db/schema";
import { AppError } from "@/lib/http";
import { addMinutes, manilaDateString } from "@/lib/time";
import { AppointmentRepository } from "@/repositories/appointment-repository";
import { PatientRepository } from "@/repositories/patient-repository";
import { ServiceRepository } from "@/repositories/service-repository";
import { WalkInRepository } from "@/repositories/walkin-repository";
import type { GuestPatientInput } from "@/services/booking-service";
import { recordAudit } from "@/services/audit-service";
import { assignDoctor } from "@/services/scheduling-service";

const walkInRepository = new WalkInRepository();
const patientRepository = new PatientRepository();
const appointmentRepository = new AppointmentRepository();
const serviceRepository = new ServiceRepository();

function roundUpToStep(date: Date) {
  const stepMs = 15 * 60_000;
  return new Date(Math.ceil(date.getTime() / stepMs) * stepMs);
}

export type WalkInInput = {
  patient: GuestPatientInput;
  serviceId?: string;
  immediate?: boolean;
};

export async function registerWalkInService(input: WalkInInput, actorUserId: string) {
  const clinicDate = manilaDateString(new Date());

  const result = await db.transaction(async (tx) => {
    const patient = await patientRepository.create(input.patient, tx);

    if (input.immediate && input.serviceId) {
      const service = await serviceRepository.findById(input.serviceId);
      if (!service || !service.isActive) throw new AppError(404, "Service not found");

      const startAt = roundUpToStep(new Date());
      const doctorId = await assignDoctor(service, startAt, tx);

      if (doctorId) {
        const appointment = await appointmentRepository.create(
          {
            patientId: patient.id,
            serviceId: service.id,
            doctorId,
            source: "WALK_IN",
            status: "CONFIRMED",
            requestedStartAt: startAt,
            startsAt: startAt,
            endsAt: addMinutes(startAt, service.durationMinutes),
            durationMinutes: service.durationMinutes,
            fee: service.fee,
            bufferBeforeMinutes: service.bufferBeforeMinutes,
            bufferAfterMinutes: service.bufferAfterMinutes,
            createdByUserId: actorUserId,
            approvedByUserId: actorUserId,
            approvedAt: new Date(),
          },
          tx,
        );
        await appointmentRepository.addHistory(
          { appointmentId: appointment.id, fromStatus: null, toStatus: "CONFIRMED", actorUserId, reason: "Walk-in" },
          tx,
        );
        return { patient, appointment, queueEntry: null };
      }
    }

    const queueEntry = await walkInRepository.createWithQueueNumber(
      { patientId: patient.id, clinicDate, createdByUserId: actorUserId },
      tx,
    );
    return { patient, appointment: null, queueEntry };
  });

  await recordAudit({
    actorUserId,
    action: "walkin.registered",
    entityType: "patient",
    entityId: result.patient.id,
    metadata: {
      appointmentId: result.appointment?.id,
      queueNumber: result.queueEntry?.queueNumber,
    },
  });

  return result;
}

export async function listWalkInsService(date?: string) {
  return walkInRepository.listByDate(date ?? manilaDateString(new Date()));
}

const ALLOWED: Record<WalkInStatus, WalkInStatus[]> = {
  WAITING: ["CALLED", "CANCELLED", "NO_SHOW"],
  CALLED: ["IN_SERVICE", "CANCELLED", "NO_SHOW"],
  IN_SERVICE: ["COMPLETED"],
  COMPLETED: [],
  NO_SHOW: [],
  CANCELLED: [],
};

async function transitionWalkIn(
  id: string,
  actorUserId: string,
  to: WalkInStatus,
  action: string,
  extra: Partial<typeof import("@/db/schema").walkInQueueEntries.$inferInsert> = {},
) {
  const entry = await walkInRepository.findById(id);
  if (!entry) throw new AppError(404, "Queue entry not found");
  const currentStatus = entry.status as WalkInStatus;
  if (!ALLOWED[currentStatus].includes(to)) {
    throw new AppError(409, `Cannot move queue entry from ${currentStatus} to ${to}`);
  }
  const updated = await walkInRepository.updateStatus(id, to, extra);
  await recordAudit({ actorUserId, action, entityType: "walk_in", entityId: id, metadata: { to } });
  return updated;
}

export async function callWalkInService(id: string, actorUserId: string) {
  return transitionWalkIn(id, actorUserId, "CALLED", "walkin.called", { calledAt: new Date() });
}

export async function startWalkInService(id: string, actorUserId: string, doctorId?: string) {
  return db.transaction(async (tx) => {
    const entry = await walkInRepository.findByIdForUpdate(id, tx);
    if (!entry) throw new AppError(404, "Queue entry not found");
    if (!ALLOWED[entry.status as WalkInStatus].includes("IN_SERVICE")) {
      throw new AppError(409, `Cannot start a queue entry in ${entry.status}`);
    }

    let assignedDoctor = entry.doctorId ?? doctorId ?? null;
    if (!assignedDoctor && entry.appointmentId) {
      const appointment = await appointmentRepository.findById(entry.appointmentId, tx);
      if (appointment) {
        const service = await serviceRepository.findById(appointment.serviceId);
        if (service) {
          assignedDoctor = await assignDoctor(service, roundUpToStep(new Date()), tx);
        }
      }
    }

    const [updated] = await tx
      .update(walkInQueueEntries)
      .set({
        status: "IN_SERVICE",
        serviceStartedAt: new Date(),
        doctorId: assignedDoctor,
        updatedAt: new Date(),
      })
      .where(eq(walkInQueueEntries.id, id))
      .returning();

    await recordAudit({ actorUserId, action: "walkin.started", entityType: "walk_in", entityId: id });
    return updated;
  });
}

export async function completeWalkInService(id: string, actorUserId: string) {
  return transitionWalkIn(id, actorUserId, "COMPLETED", "walkin.completed", { completedAt: new Date() });
}

export async function cancelWalkInService(id: string, actorUserId: string) {
  return transitionWalkIn(id, actorUserId, "CANCELLED", "walkin.cancelled");
}
