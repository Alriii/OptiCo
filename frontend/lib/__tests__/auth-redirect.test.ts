import { describe, expect, it } from "vitest";
import { hasRole, portalPathForRole } from "@/lib/auth-redirect";

describe("role routing", () => {
  it("maps every clinic role to its own portal", () => {
    expect(portalPathForRole("PATIENT")).toBe("/patient");
    expect(portalPathForRole("doctor")).toBe("/doctor");
    expect(portalPathForRole("RECEPTIONIST")).toBe("/staff");
    expect(portalPathForRole("ADMIN")).toBe("/admin");
    expect(portalPathForRole(undefined)).toBe("/");
  });

  it("checks roles case-insensitively and fails closed", () => {
    expect(hasRole("admin", ["ADMIN"])).toBe(true);
    expect(hasRole("PATIENT", ["DOCTOR", "ADMIN"])).toBe(false);
    expect(hasRole(null, ["PATIENT"])).toBe(false);
  });
});
