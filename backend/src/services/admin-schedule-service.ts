import { AppError } from "@/lib/http";
import { addMinutes, manilaDayRange, manilaTimeToUtc } from "@/lib/time";
import { DoctorRepository } from "@/repositories/doctor-repository";
import {
  ScheduleRepository,
  type ClinicHourInput,
  type WeeklyAvailabilityInput,
} from "@/repositories/schedule-repository";
import { recordAudit } from "@/services/audit-service";

const scheduleRepository = new ScheduleRepository();
const doctorRepository = new DoctorRepository();

export async function getClinicHoursService() {
  return scheduleRepository.listClinicHours();
}

export async function updateClinicHoursService(rows: ClinicHourInput[], actorUserId: string) {
  for (const row of rows) {
    if (row.isOpen) {
      if (!row.openTime || !row.closeTime) throw new AppError(400, "Open days need an opening and closing time");
      if (row.openTime >= row.closeTime) throw new AppError(400, "Opening time must be before closing time");
    }
  }

  await scheduleRepository.replaceClinicHours(rows);
  await recordAudit({
    actorUserId,
    action: "clinic_hours.updated",
    entityType: "clinic_hours",
    metadata: { days: rows.length },
  });
  return scheduleRepository.listClinicHours();
}

export async function listClosuresService() {
  return scheduleRepository.listClosures();
}

export async function createClosureService(
  input: { startsOn: string; endsOn: string; reason?: string | null },
  actorUserId: string,
) {
  if (input.endsOn < input.startsOn) throw new AppError(400, "Closure end date must not be before the start date");
  const closure = await scheduleRepository.createClosure(input);
  await recordAudit({
    actorUserId,
    action: "clinic_closure.created",
    entityType: "clinic_closure",
    entityId: closure.id,
    metadata: { startsOn: closure.startsOn, endsOn: closure.endsOn },
  });
  return closure;
}

export async function deleteClosureService(id: string, actorUserId: string) {
  const closure = await scheduleRepository.deleteClosure(id);
  if (!closure) throw new AppError(404, "Closure not found");
  await recordAudit({
    actorUserId,
    action: "clinic_closure.deleted",
    entityType: "clinic_closure",
    entityId: id,
  });
  return { deleted: true };
}

export async function getDoctorAvailabilityService(doctorId: string) {
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor) throw new AppError(404, "Doctor not found");
  return scheduleRepository.listWeeklyAvailability(doctorId);
}

export async function getMyAvailabilityService(userId: string) {
  const doctor = await doctorRepository.findByUserId(userId);
  if (!doctor) throw new AppError(403, "Doctor profile not found");
  return scheduleRepository.listWeeklyAvailability(doctor.id);
}

export async function replaceDoctorAvailabilityService(
  doctorId: string,
  rows: WeeklyAvailabilityInput[],
  actorUserId: string,
) {
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor) throw new AppError(404, "Doctor not found");

  for (const row of rows) {
    if (row.startTime >= row.endTime) throw new AppError(400, "Availability start must be before end");
    if (row.breakStart || row.breakEnd) {
      if (!row.breakStart || !row.breakEnd) throw new AppError(400, "A break needs both a start and an end");
      if (row.breakStart < row.startTime || row.breakEnd > row.endTime || row.breakStart >= row.breakEnd) {
        throw new AppError(400, "Break must sit inside the availability window");
      }
    }

    const clinicHour = await scheduleRepository.getClinicHour(row.weekday);
    if (!clinicHour?.isOpen || !clinicHour.openTime || !clinicHour.closeTime) {
      throw new AppError(400, "Doctor availability cannot be set on a closed clinic day");
    }
    if (row.startTime < clinicHour.openTime || row.endTime > clinicHour.closeTime) {
      throw new AppError(400, "Doctor availability must stay inside clinic hours");
    }
  }

  await scheduleRepository.replaceWeeklyAvailability(doctorId, rows);
  await recordAudit({
    actorUserId,
    action: "doctor_availability.updated",
    entityType: "doctor",
    entityId: doctorId,
    metadata: { windows: rows.length },
  });
  return scheduleRepository.listWeeklyAvailability(doctorId);
}

export async function listDoctorExceptionsService(doctorId: string, date?: string) {
  const range = date ? manilaDayRange(date) : undefined;
  return scheduleRepository.listExceptions(doctorId, range?.start, range?.end);
}

export async function createDoctorExceptionService(
  doctorId: string,
  input: { date: string; startTime: string; endTime: string; type: "UNAVAILABLE" | "ADDITIONAL" | "TIME_OFF"; reason?: string | null },
  actorUserId: string,
) {
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor) throw new AppError(404, "Doctor not found");

  const startsAt = manilaTimeToUtc(input.date, input.startTime);
  const endsAt = manilaTimeToUtc(input.date, input.endTime);
  if (endsAt <= startsAt) throw new AppError(400, "Exception end must be after the start");
  if (addMinutes(startsAt, 24 * 60) < endsAt) throw new AppError(400, "An exception must stay within one clinic day");

  const exception = await scheduleRepository.createException(doctorId, {
    startsAt,
    endsAt,
    type: input.type,
    reason: input.reason ?? null,
  });
  await recordAudit({
    actorUserId,
    action: "doctor_exception.created",
    entityType: "doctor",
    entityId: doctorId,
    metadata: { type: input.type },
  });
  return exception;
}
