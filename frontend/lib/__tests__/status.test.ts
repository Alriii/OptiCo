import { describe, expect, it } from "vitest";
import {
  appointmentStatusMeta,
  paymentStatusMeta,
  queueStatusMeta,
} from "@/lib/status";

describe("status labels", () => {
  it("never presents a pending request as confirmed", () => {
    expect(appointmentStatusMeta("PENDING")).toEqual({
      label: "Awaiting approval",
      tone: "warning",
    });
    expect(appointmentStatusMeta("confirmed").label).toBe("Confirmed");
    expect(appointmentStatusMeta("unexpected_status")).toEqual({
      label: "unexpected status",
      tone: "neutral",
    });
  });

  it("normalizes both partial payment codes and queue statuses", () => {
    expect(paymentStatusMeta("PARTIAL").label).toBe("Partially paid");
    expect(paymentStatusMeta("partially_paid").label).toBe("Partially paid");
    expect(queueStatusMeta("IN_SERVICE")).toEqual({
      label: "In service",
      tone: "info",
    });
  });
});
