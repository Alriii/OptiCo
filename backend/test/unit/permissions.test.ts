import { describe, expect, it } from "vitest";
import {
  hasPermission,
  permissionsFor,
  PERMISSIONS,
} from "@/lib/permissions";

describe("Role and Permission Matrix", () => {
  it("grants patient only own appointment permissions", () => {
    const patientPermissions = permissionsFor("PATIENT");
    expect(patientPermissions).toContain("appointments.read_own");
    expect(patientPermissions).toContain("appointments.request");
    expect(patientPermissions).toContain("appointments.reschedule");
    expect(patientPermissions).toContain("appointments.cancel");

    // Patients cannot access staff, doctor, or all appointments
    expect(hasPermission("PATIENT", "appointments.read_all")).toBe(false);
    expect(hasPermission("PATIENT", "appointments.approve")).toBe(false);
    expect(hasPermission("PATIENT", "appointments.reject")).toBe(false);
    expect(hasPermission("PATIENT", "services.manage")).toBe(false);
    expect(hasPermission("PATIENT", "staff.manage")).toBe(false);
    expect(hasPermission("PATIENT", "payments.record")).toBe(false);
  });

  it("grants doctor only assigned appointments and clinical status transitions", () => {
    const doctorPermissions = permissionsFor("DOCTOR");
    expect(doctorPermissions).toContain("appointments.read_assigned");
    expect(doctorPermissions).toContain("appointments.check_in");
    expect(doctorPermissions).toContain("appointments.complete");

    // Doctors cannot manage services, staff, clinic hours, or record payments
    expect(hasPermission("DOCTOR", "appointments.read_all")).toBe(false);
    expect(hasPermission("DOCTOR", "appointments.approve")).toBe(false);
    expect(hasPermission("DOCTOR", "services.manage")).toBe(false);
    expect(hasPermission("DOCTOR", "staff.manage")).toBe(false);
    expect(hasPermission("DOCTOR", "payments.record")).toBe(false);
  });

  it("grants receptionist operational scheduling and payment permissions", () => {
    expect(hasPermission("RECEPTIONIST", "appointments.read_all")).toBe(true);
    expect(hasPermission("RECEPTIONIST", "appointments.approve")).toBe(true);
    expect(hasPermission("RECEPTIONIST", "appointments.reject")).toBe(true);
    expect(hasPermission("RECEPTIONIST", "walkins.manage")).toBe(true);
    expect(hasPermission("RECEPTIONIST", "payments.record")).toBe(true);
    expect(hasPermission("RECEPTIONIST", "payments.read")).toBe(true);

    // Receptionists cannot manage staff or delete/alter clinic settings
    expect(hasPermission("RECEPTIONIST", "staff.manage")).toBe(false);
    expect(hasPermission("RECEPTIONIST", "clinic_settings.manage")).toBe(false);
  });

  it("grants admin all permissions across the system", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
    }
  });
});
