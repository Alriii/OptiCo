import { db, type DbClient } from "@/db";
import type { Service } from "@/db/schema";
import { AppError } from "@/lib/http";
import {
  addMinutes,
  formatManilaTime,
  isValidManilaDate,
  manilaDateString,
  manilaDayRange,
  manilaTimeToUtc,
  rangesOverlap,
  weekdayOfManilaDate,
} from "@/lib/time";
import { DoctorRepository } from "@/repositories/doctor-repository";
import { ScheduleRepository } from "@/repositories/schedule-repository";
import { ServiceRepository } from "@/repositories/service-repository";

const STEP_MINUTES = 15;

type Window = { start: Date; end: Date; breakStart?: Date | null; breakEnd?: Date | null };

export type DayContext = {
  closed: boolean;
  clinicStart: Date | null;
  clinicEnd: Date | null;
  weekly: Window[];
  additional: Window[];
  unavailable: Window[];
  blocking: Window[];
};

const doctorRepository = new DoctorRepository();
const scheduleRepository = new ScheduleRepository();
const serviceRepository = new ServiceRepository();

function coversWindow(windows: Window[], start: Date, end: Date): boolean {
  return windows.some((window) => {
    const inside = window.start.getTime() <= start.getTime() && window.end.getTime() >= end.getTime();
    if (!inside) return false;
    if (window.breakStart && window.breakEnd) {
      return !rangesOverlap(start, end, window.breakStart, window.breakEnd);
    }
    return true;
  });
}

function anyOverlap(intervals: Window[], start: Date, end: Date): boolean {
  return intervals.some((interval) => rangesOverlap(start, end, interval.start, interval.end));
}

export async function buildDayContext(
  doctorId: string,
  dateStr: string,
  client: DbClient = db,
): Promise<DayContext> {
  const weekday = weekdayOfManilaDate(dateStr);
  const [clinicHour, closure, weeklyRows] = await Promise.all([
    scheduleRepository.getClinicHour(weekday, client),
    scheduleRepository.findClosureForDate(dateStr, client),
    scheduleRepository.weeklyAvailabilityForDate(doctorId, weekday, dateStr, client),
  ]);

  const closed = Boolean(closure) || !clinicHour?.isOpen || !clinicHour.openTime || !clinicHour.closeTime;
  if (closed) {
    return { closed: true, clinicStart: null, clinicEnd: null, weekly: [], additional: [], unavailable: [], blocking: [] };
  }

  const clinicStart = manilaTimeToUtc(dateStr, clinicHour.openTime as string);
  const clinicEnd = manilaTimeToUtc(dateStr, clinicHour.closeTime as string);
  const { start: dayStart, end: dayEnd } = manilaDayRange(dateStr);

  const [exceptions, blockingRows] = await Promise.all([
    scheduleRepository.exceptionsForRange(doctorId, dayStart, dayEnd, client),
    doctorRepository.findBlockingAppointments(doctorId, addMinutes(dayStart, -360), addMinutes(dayEnd, 360), client),
  ]);

  const weekly: Window[] = (
    weeklyRows as { startTime: string; endTime: string; breakStart: string | null; breakEnd: string | null }[]
  ).map((row) => ({
    start: manilaTimeToUtc(dateStr, row.startTime),
    end: manilaTimeToUtc(dateStr, row.endTime),
    breakStart: row.breakStart ? manilaTimeToUtc(dateStr, row.breakStart) : null,
    breakEnd: row.breakEnd ? manilaTimeToUtc(dateStr, row.breakEnd) : null,
  }));

  const additional: Window[] = [];
  const unavailable: Window[] = [];
  for (const exception of exceptions) {
    const window = { start: exception.startsAt, end: exception.endsAt };
    if (exception.type === "ADDITIONAL") additional.push(window);
    else unavailable.push(window);
  }

  const blocking: Window[] = (
    blockingRows as { startsAt: Date; endsAt: Date; bufferBeforeMinutes: number | null; bufferAfterMinutes: number | null }[]
  ).map((row) => ({
    start: addMinutes(row.startsAt, -(row.bufferBeforeMinutes ?? 0)),
    end: addMinutes(row.endsAt, row.bufferAfterMinutes ?? 0),
  }));

  return { closed, clinicStart, clinicEnd, weekly, additional, unavailable, blocking };
}

export function isDoctorFree(
  context: DayContext,
  service: Pick<Service, "durationMinutes" | "bufferBeforeMinutes" | "bufferAfterMinutes">,
  startAt: Date,
  checkAppointments = true,
): boolean {
  if (context.closed || !context.clinicStart || !context.clinicEnd) return false;

  const endAt = addMinutes(startAt, service.durationMinutes);
  if (startAt.getTime() < context.clinicStart.getTime() || endAt.getTime() > context.clinicEnd.getTime()) return false;
  if (!coversWindow(context.weekly, startAt, endAt) && !coversWindow(context.additional, startAt, endAt)) return false;
  if (anyOverlap(context.unavailable, startAt, endAt)) return false;

  if (checkAppointments) {
    const bufferedStart = addMinutes(startAt, -service.bufferBeforeMinutes);
    const bufferedEnd = addMinutes(endAt, service.bufferAfterMinutes);
    if (anyOverlap(context.blocking, bufferedStart, bufferedEnd)) return false;
  }

  return true;
}

export async function getAvailability(serviceId: string, dateStr: string) {
  if (!isValidManilaDate(dateStr)) throw new AppError(400, "Date must be a valid YYYY-MM-DD Manila date");

  const service = await serviceRepository.findById(serviceId);
  if (!service || !service.isActive) throw new AppError(404, "Service not found");

  const weekday = weekdayOfManilaDate(dateStr);
  const clinicHour = await scheduleRepository.getClinicHour(weekday);
  const closure = await scheduleRepository.findClosureForDate(dateStr);
  if (closure || !clinicHour?.isOpen || !clinicHour.openTime || !clinicHour.closeTime) {
    return { date: dateStr, timezone: "Asia/Manila" as const, slots: [] };
  }

  const doctors = await doctorRepository.listEligibleForService(service.id);
  if (doctors.length === 0) {
    return { date: dateStr, timezone: "Asia/Manila" as const, slots: [] };
  }

  const contexts = await Promise.all(doctors.map((doctor) => buildDayContext(doctor.id, dateStr)));
  const clinicStart = manilaTimeToUtc(dateStr, clinicHour.openTime);
  const clinicEnd = manilaTimeToUtc(dateStr, clinicHour.closeTime);
  const now = Date.now();

  const slots: { startAt: string; label: string }[] = [];
  for (
    let cursor = clinicStart;
    addMinutes(cursor, service.durationMinutes).getTime() <= clinicEnd.getTime();
    cursor = addMinutes(cursor, STEP_MINUTES)
  ) {
    if (cursor.getTime() <= now) continue;
    if (contexts.some((context) => isDoctorFree(context, service, cursor))) {
      slots.push({ startAt: cursor.toISOString(), label: formatManilaTime(cursor) });
    }
  }

  return { date: dateStr, timezone: "Asia/Manila" as const, slots };
}

/** Request validation ignores existing bookings because pending requests do not reserve slots. */
export async function hasScheduleCoverage(service: Service, startAt: Date): Promise<boolean> {
  const dateStr = manilaDateString(startAt);
  const doctors = await doctorRepository.listEligibleForService(service.id);
  if (doctors.length === 0) return false;

  const contexts = await Promise.all(doctors.map((doctor) => buildDayContext(doctor.id, dateStr)));
  return contexts.some((context) => isDoctorFree(context, service, startAt, false));
}

export function assertAlignedSlot(startAt: Date) {
  if (startAt.getTime() % (STEP_MINUTES * 60_000) !== 0) {
    throw new AppError(400, "Requested time must align to a 15-minute slot");
  }
}

/**
 * Locks eligible doctor rows in id order, rechecks the full interval, then
 * picks the least busy doctor. Must run inside the approval transaction.
 */
export async function assignDoctor(service: Service, startAt: Date, client: DbClient): Promise<string | null> {
  const dateStr = manilaDateString(startAt);
  const candidateIds = await doctorRepository.lockEligibleForService(service.id, client);
  if (candidateIds.length === 0) return null;

  const contexts = new Map<string, DayContext>();
  const free: string[] = [];
  for (const doctorId of candidateIds) {
    const context = await buildDayContext(doctorId, dateStr, client);
    contexts.set(doctorId, context);
    if (isDoctorFree(context, service, startAt)) free.push(doctorId);
  }
  if (free.length === 0) return null;

  const { start: dayStart, end: dayEnd } = manilaDayRange(dateStr);
  let best: { id: string; workload: number } | null = null;
  for (const doctorId of free) {
    const workload = await doctorRepository.countScheduledOnDate(doctorId, dayStart, dayEnd, client);
    if (!best || workload < best.workload || (workload === best.workload && doctorId < best.id)) {
      best = { id: doctorId, workload };
    }
  }

  return best?.id ?? null;
}
