import { describe, expect, it } from "vitest";
import { ageOnDate, isMinor, requiresGuardian } from "@/lib/booking";

describe("guardian requirements", () => {
  it("uses the appointment date, not the booking date", () => {
    const dob = "2008-06-15";

    expect(
      requiresGuardian(dob, "2026-06-14"),
    ).toBe(true);
    expect(
      requiresGuardian(dob, "2026-06-15"),
    ).toBe(false);
  });

  it("computes age safely and ignores missing dates", () => {
    const reference = new Date("2026-11-22T00:00:00Z");

    expect(ageOnDate("2000-11-23", reference)).toBe(25);
    expect(ageOnDate("2000-11-22", reference)).toBe(26);
    expect(ageOnDate("not-a-date", reference)).toBeNull();
    expect(isMinor(null, reference)).toBe(false);
  });
});
