import { describe, expect, it } from "vitest";
import {
  canDoctorTransition,
  canTransition,
  isBlockingStatus,
} from "@/lib/appointment-status";

describe("Appointment Lifecycle & Status Transitions", () => {
  it("allows valid transitions from PENDING", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("PENDING", "REJECTED")).toBe(true);
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);

    // Illegal jumps from PENDING
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
    expect(canTransition("PENDING", "IN_PROGRESS")).toBe(false);
    expect(canTransition("PENDING", "CHECKED_IN")).toBe(false);
  });

  it("allows standard clinic operational flow CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED", () => {
    expect(canTransition("CONFIRMED", "CHECKED_IN")).toBe(true);
    expect(canTransition("CHECKED_IN", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("terminal states cannot transition further", () => {
    expect(canTransition("COMPLETED", "PENDING")).toBe(false);
    expect(canTransition("COMPLETED", "CONFIRMED")).toBe(false);
    expect(canTransition("REJECTED", "CONFIRMED")).toBe(false);
    expect(canTransition("CANCELLED", "PENDING")).toBe(false);
    expect(canTransition("NO_SHOW", "CONFIRMED")).toBe(false);
  });

  it("correctly identifies blocking vs non-blocking states", () => {
    expect(isBlockingStatus("CONFIRMED")).toBe(true);
    expect(isBlockingStatus("CHECKED_IN")).toBe(true);
    expect(isBlockingStatus("IN_PROGRESS")).toBe(true);

    expect(isBlockingStatus("PENDING")).toBe(false);
    expect(isBlockingStatus("COMPLETED")).toBe(false);
    expect(isBlockingStatus("CANCELLED")).toBe(false);
    expect(isBlockingStatus("REJECTED")).toBe(false);
    expect(isBlockingStatus("NO_SHOW")).toBe(false);
  });

  it("enforces doctor operational permissions on status changes", () => {
    expect(canDoctorTransition("CONFIRMED", "CHECKED_IN")).toBe(true);
    expect(canDoctorTransition("CONFIRMED", "NO_SHOW")).toBe(true);
    expect(canDoctorTransition("CHECKED_IN", "IN_PROGRESS")).toBe(true);
    expect(canDoctorTransition("IN_PROGRESS", "COMPLETED")).toBe(true);

    // Doctors cannot approve pending or cancel appointments unilaterally
    expect(canDoctorTransition("PENDING" as any, "CONFIRMED")).toBe(false);
    expect(canDoctorTransition("CONFIRMED", "CANCELLED")).toBe(false);
  });
});
