import { describe, expect, it } from "vitest";
import {
  ageInYears,
  isValidManilaDate,
  manilaDateString,
  manilaTimeString,
  manilaTimeToUtc,
  utcToManilaParts,
} from "@/lib/time";

describe("Asia/Manila Time & Date Utilities", () => {
  it("validates Manila calendar date format (YYYY-MM-DD)", () => {
    expect(isValidManilaDate("2026-11-22")).toBe(true);
    expect(isValidManilaDate("2026-02-29")).toBe(false); // 2026 is not a leap year
    expect(isValidManilaDate("invalid")).toBe(false);
    expect(isValidManilaDate("2026-13-01")).toBe(false);
  });

  it("converts Manila local wall-clock time to UTC correctly (UTC+8)", () => {
    // 2026-11-22 09:00 in Manila (UTC+8) is 2026-11-22 01:00 UTC
    const utcDate = manilaTimeToUtc("2026-11-22", "09:00");
    expect(utcDate.toISOString()).toBe("2026-11-22T01:00:00.000Z");
  });

  it("formats UTC instants to Manila date and time strings", () => {
    // 01:30 UTC is 09:30 Manila
    const instant = new Date("2026-11-22T01:30:00.000Z");
    expect(manilaDateString(instant)).toBe("2026-11-22");
    expect(manilaTimeString(instant)).toBe("09:30");
  });

  it("correctly extracts Manila weekday and parts", () => {
    // 2026-11-22 is Sunday (weekday 0)
    const instant = new Date("2026-11-22T02:00:00.000Z"); // 10:00 Manila
    const parts = utcToManilaParts(instant);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(11);
    expect(parts.day).toBe(22);
    expect(parts.weekday).toBe(0);
    expect(parts.hour).toBe(10);
    expect(parts.minute).toBe(0);
  });

  it("calculates age accurately for minor patient guardian check", () => {
    // Born 2012-05-15, appointment on 2026-05-14 -> 13 years old (under 18)
    expect(ageInYears("2012-05-15", "2026-05-14")).toBe(13);
    // Born 2008-05-15, appointment on 2026-05-15 -> exactly 18 years old
    expect(ageInYears("2008-05-15", "2026-05-15")).toBe(18);
  });
});
