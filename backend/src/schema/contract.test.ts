import { describe, expect, it } from "vitest";
import {
  auditQuerySchema,
  availabilitySchema,
  clinicHoursSchema,
  closureSchema,
  exceptionSchema,
  settingsSchema,
} from "@/schema/admin-schema";
import { rescheduleSchema } from "@/schema/appointment-schema";

const UUID = "3f3f3f3f-3f3f-4f3f-8f3f-3f3f3f3f3f3f";

describe("backend request contracts", () => {
  it("requires isOpen for clinic hours", () => {
    const parsed = clinicHoursSchema.parse({
      body: {
        hours: [
          { weekday: 1, isOpen: true, openTime: "09:00", closeTime: "17:00" },
        ],
      },
    });

    expect(parsed.body.hours[0]?.isOpen).toBe(true);
    expect(() =>
      clinicHoursSchema.parse({
        body: { hours: [{ weekday: 1, open: true }] },
      }),
    ).toThrow();
  });

  it("requires closure and availability list fields", () => {
    expect(() =>
      closureSchema.parse({ body: { date: "2026-12-01" } }),
    ).toThrow();
    expect(() =>
      availabilitySchema.parse({ params: { id: UUID }, body: { days: [] } }),
    ).toThrow();
  });

  it("accepts a nullable settings email and strips unsupported keys", () => {
    const parsed = settingsSchema.parse({
      body: {
        name: "OptiCo",
        email: null,
        bookingNoticeHours: 2,
      },
    });

    expect(parsed.body).toEqual({ name: "OptiCo", email: null });
  });

  it("uses limit/from/to for audit log queries", () => {
    const parsed = auditQuerySchema.parse({
      query: {
        page: 1,
        limit: 20,
        from: "2026-11-01",
        to: "2026-11-24",
        date: "2026-11-01",
      },
    });

    expect(parsed.query).toMatchObject({
      page: 1,
      limit: 20,
      from: "2026-11-01",
      to: "2026-11-24",
    });
    expect(parsed.query).not.toHaveProperty("date");
  });

  it("strips an unsupported reschedule reason", () => {
    const parsed = rescheduleSchema.parse({
      params: { id: UUID },
      body: {
        startAt: "2026-11-25T01:00:00.000Z",
        reason: "ignored by the API",
      },
    });

    expect(parsed.body).toEqual({ startAt: "2026-11-25T01:00:00.000Z" });
  });

  it("accepts API time strings and normalizes them for schedule comparisons", () => {
    const hours = clinicHoursSchema.parse({
      body: {
        hours: [
          {
            weekday: 1,
            isOpen: true,
            openTime: "09:00:00",
            closeTime: "17:00:00",
          },
        ],
      },
    });
    const availability = availabilitySchema.parse({
      params: { id: UUID },
      body: {
        windows: [
          {
            weekday: 1,
            startTime: "09:00",
            endTime: "17:00:00",
            breakStart: "12:00",
            breakEnd: "13:00:00",
          },
        ],
      },
    });
    const exception = exceptionSchema.parse({
      params: { id: UUID },
      body: {
        date: "2026-11-25",
        startTime: "09:00:00",
        endTime: "17:00",
        type: "UNAVAILABLE",
      },
    });

    expect(hours.body.hours[0]).toMatchObject({
      openTime: "09:00:00",
      closeTime: "17:00:00",
    });
    expect(availability.body.windows[0]).toMatchObject({
      startTime: "09:00:00",
      endTime: "17:00:00",
      breakStart: "12:00:00",
      breakEnd: "13:00:00",
    });
    expect(exception.body).toMatchObject({
      startTime: "09:00:00",
      endTime: "17:00:00",
    });
  });

  it("still rejects malformed schedule times", () => {
    expect(() =>
      clinicHoursSchema.parse({
        body: {
          hours: [
            { weekday: 1, isOpen: true, openTime: "9:00", closeTime: "17:00" },
          ],
        },
      }),
    ).toThrow("Time must be HH:MM or HH:MM:SS");
  });
});
