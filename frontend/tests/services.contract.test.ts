import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({ default: apiMock }));

import { adminService, type SettingsInput } from "@/services/admin.service";
import { doctorService } from "@/services/doctor.service";
import { patientService } from "@/services/patient.service";
import { publicService } from "@/services/public.service";
import { staffService } from "@/services/staff.service";
import type { StaffAppointmentParams } from "@/services/types";

function apiResponse<T>(data: T) {
  return { data: { status: "success" as const, data } };
}

describe("frontend API contract adapters", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("maps clinic hour isOpen from the wire to open for the UI", async () => {
    apiMock.get.mockResolvedValue(
      apiResponse({
        hours: [
          { weekday: 1, isOpen: true, openTime: "09:00", closeTime: "17:00" },
          { weekday: 2, isOpen: false, openTime: null, closeTime: null },
        ],
      }),
    );

    const response = await adminService.getClinicHours();

    expect(apiMock.get).toHaveBeenCalledWith("/admin/clinic-hours");
    expect(response.data).toEqual({
      hours: [
        { weekday: 1, open: true, openTime: "09:00", closeTime: "17:00" },
        { weekday: 2, open: false, openTime: null, closeTime: null },
      ],
    });
  });

  it("sends clinic hours back with isOpen", async () => {
    apiMock.put.mockResolvedValueOnce(apiResponse({ hours: [] }));

    await adminService.updateClinicHours([
      { weekday: 1, open: true, openTime: "09:00", closeTime: "17:00" },
      { weekday: 2, open: false },
    ]);

    expect(apiMock.put).toHaveBeenCalledWith("/admin/clinic-hours", {
      hours: [
        { weekday: 1, isOpen: true, openTime: "09:00", closeTime: "17:00" },
        { weekday: 2, isOpen: false, openTime: null, closeTime: null },
      ],
    });
  });

  it("maps closure startsOn to the UI date and sends the range payload", async () => {
    apiMock.get.mockResolvedValueOnce(
      apiResponse({
        closures: [
          {
            id: "closure-1",
            startsOn: "2026-12-01",
            endsOn: "2026-12-01",
            reason: "Holiday",
          },
        ],
      }),
    );
    apiMock.post.mockResolvedValueOnce(
      apiResponse({ closure: { id: "closure-1" } }),
    );

    const listed = await adminService.getClosures();
    await adminService.createClosure({ date: "2026-12-01", reason: "Holiday" });

    expect(listed.data).toEqual({
      closures: [
        {
          id: "closure-1",
          startsOn: "2026-12-01",
          endsOn: "2026-12-01",
          date: "2026-12-01",
          reason: "Holiday",
        },
      ],
    });
    expect(apiMock.post).toHaveBeenCalledWith("/admin/closures", {
      startsOn: "2026-12-01",
      endsOn: "2026-12-01",
      reason: "Holiday",
    });
  });

  it("unwraps doctor availability windows in both directions", async () => {
    const windows = [
      { weekday: 1, startTime: "09:00", endTime: "17:00" },
    ];
    apiMock.get.mockResolvedValueOnce(apiResponse({ windows }));
    apiMock.put.mockResolvedValueOnce(apiResponse({ windows }));

    const fetched = await adminService.getDoctorAvailability("doctor-1");
    await adminService.updateDoctorAvailability("doctor-1", windows);

    expect(fetched.data).toEqual(windows);
    expect(apiMock.put).toHaveBeenCalledWith(
      "/admin/doctors/doctor-1/availability",
      { windows },
    );
  });

  it("unwraps settings and only sends persisted fields", async () => {
    apiMock.get.mockResolvedValueOnce(
      apiResponse({ settings: { name: "OptiCo", email: null } }),
    );
    apiMock.patch.mockResolvedValueOnce(
      apiResponse({ settings: { name: "OptiCo", email: null } }),
    );

    const fetched = await adminService.getSettings();
    await adminService.updateSettings({
      name: "OptiCo",
      address: "1 Main St",
      email: "",
      bookingNoticeHours: 2,
    } as Partial<SettingsInput>);

    expect(fetched.data).toEqual({ name: "OptiCo", email: null });
    expect(apiMock.patch).toHaveBeenCalledWith("/admin/settings", {
      name: "OptiCo",
      address: "1 Main St",
      email: null,
    });
  });

  it("sends audit log filters using limit/from/to", async () => {
    apiMock.get.mockResolvedValueOnce(apiResponse([]));

    await adminService.getAuditLogs({
      page: 2,
      limit: 20,
      action: "walkin.registered",
      from: "2026-11-01",
      to: "2026-11-24",
    });

    expect(apiMock.get).toHaveBeenCalledWith("/admin/audit-logs", {
      params: {
        page: 2,
        limit: 20,
        action: "walkin.registered",
        from: "2026-11-01",
        to: "2026-11-24",
      },
    });
  });

  it("maps staff pagination to limit and strips reschedule reasons", async () => {
    apiMock.get.mockResolvedValueOnce(apiResponse([]));
    apiMock.post.mockResolvedValueOnce(
      apiResponse({ appointment: { id: "appointment-1" } }),
    );

    await staffService.getAppointments({
      page: 1,
      pageSize: 25,
      status: "PENDING",
    } as StaffAppointmentParams & { pageSize?: number });
    const rescheduleInput: { startAt: string; reason?: string } = {
      startAt: "2026-11-25T01:00:00.000Z",
      reason: "ignored by the API",
    };
    await staffService.reschedule("appointment-1", rescheduleInput);

    expect(apiMock.get).toHaveBeenCalledWith("/staff/appointments", {
      params: { page: 1, status: "PENDING", limit: 25 },
    });
    expect(apiMock.post).toHaveBeenCalledWith(
      "/staff/appointments/appointment-1/reschedule",
      { startAt: "2026-11-25T01:00:00.000Z" },
    );
  });

  it("unwraps walk-in entries and doctor availability windows", async () => {
    apiMock.get
      .mockResolvedValueOnce(apiResponse({ entries: [{ id: "walkin-1" }] }))
      .mockResolvedValueOnce(
        apiResponse({ windows: [{ weekday: 1, startTime: "09:00", endTime: "17:00" }] }),
      );

    const walkIns = await staffService.getWalkIns("2026-11-24");
    const availability = await doctorService.getAvailability();

    expect(walkIns.data).toEqual([{ id: "walkin-1" }]);
    expect(availability.data).toEqual([
      { weekday: 1, startTime: "09:00", endTime: "17:00" },
    ]);
  });

  it("drops unsupported patient profile and reschedule fields", async () => {
    apiMock.patch.mockResolvedValueOnce(
      apiResponse({ patient: { id: "patient-1", fullName: "Jane Doe" } }),
    );
    apiMock.post.mockResolvedValueOnce(apiResponse({ ok: true }));

    await patientService.updateProfile({
      fullName: "Jane Doe",
      email: "jane@example.com",
      mobile: "09171234567",
      dateOfBirth: "1990-01-01",
    });
    const rescheduleInput: { startAt: string; reason?: string } = {
      startAt: "2026-11-25T01:00:00.000Z",
      reason: "ignored by the API",
    };
    await patientService.requestReschedule("appointment-1", rescheduleInput);

    expect(apiMock.patch).toHaveBeenCalledWith("/patient/profile", {
      fullName: "Jane Doe",
      mobile: "09171234567",
      dateOfBirth: "1990-01-01",
    });
    expect(apiMock.post).toHaveBeenCalledWith(
      "/patient/appointments/appointment-1/reschedule-request",
      { startAt: "2026-11-25T01:00:00.000Z" },
    );
  });

  it("maps public clinic hours and string service names", async () => {
    apiMock.get
      .mockResolvedValueOnce(
        apiResponse({
          name: "OptiCo",
          hours: [
            {
              weekday: 1,
              isOpen: true,
              openTime: "09:00",
              closeTime: "17:00",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        apiResponse({
          doctors: [{ id: "doctor-1", displayName: "Dr Reyes", services: ["svc-1"] }],
        }),
      );

    const clinic = await publicService.getClinic();
    const doctors = await publicService.getDoctors();

    expect(clinic.data.hours?.[0]).toEqual({
      weekday: 1,
      isOpen: true,
      openTime: "09:00",
      closeTime: "17:00",
      open: true,
    });
    expect(doctors.data).toEqual({
      doctors: [
        {
          id: "doctor-1",
          displayName: "Dr Reyes",
          services: [{ id: "svc-1", name: "svc-1" }],
        },
      ],
    });
  });
});
