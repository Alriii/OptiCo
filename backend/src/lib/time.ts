// Asia/Manila is a fixed UTC+8 offset with no daylight saving, so plain
// arithmetic is safer than relying on the host timezone database.
const MANILA_OFFSET_MINUTES = 8 * 60;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export function isValidManilaDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export function manilaDateString(date: Date): string {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_MINUTES * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function manilaTimeString(date: Date): string {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_MINUTES * 60_000);
  return `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
}

/** Convert a Manila calendar date and local wall-clock time into a UTC instant. */
export function manilaTimeToUtc(dateStr: string, timeStr: string): Date {
  if (!isValidManilaDate(dateStr)) throw new Error(`Invalid Manila date: ${dateStr}`);
  const match = TIME_PATTERN.exec(timeStr);
  if (!match) throw new Error(`Invalid Manila time: ${timeStr}`);

  const [year, month, day] = dateStr.split("-").map(Number);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] ? Number(match[3]) : 0;
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - MANILA_OFFSET_MINUTES * 60_000);
}

export function utcToManilaParts(date: Date) {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_MINUTES * 60_000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  return {
    year,
    month,
    day,
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
    dateString: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    timeString: `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`,
  };
}

export function formatManilaTime(date: Date): string {
  const { hour, minute } = utcToManilaParts(date);
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatManilaDateTime(date: Date): string {
  const { year, month, day } = utcToManilaParts(date);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year} ${formatManilaTime(date)}`;
}

/** Whole years between a Manila birth date and a Manila reference date. */
export function ageInYears(dateOfBirth: string, referenceDate: string): number {
  const [birthYear, birthMonth, birthDay] = dateOfBirth.split("-").map(Number);
  const [refYear, refMonth, refDay] = referenceDate.split("-").map(Number);
  let age = refYear - birthYear;
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) age -= 1;
  return age;
}

export function weekdayOfManilaDate(dateStr: string): number {
  if (!isValidManilaDate(dateStr)) throw new Error(`Invalid Manila date: ${dateStr}`);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function timeStringToMinutes(timeStr: string): number {
  const match = TIME_PATTERN.exec(timeStr);
  if (!match) throw new Error(`Invalid time: ${timeStr}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

/** UTC bounds for one Manila calendar day. */
export function manilaDayRange(dateStr: string): { start: Date; end: Date } {
  const start = manilaTimeToUtc(dateStr, "00:00");
  return { start, end: addMinutes(start, 24 * 60) };
}
