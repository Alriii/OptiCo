import { z } from "zod";
import api from "@/lib/axios";
import type {
  AdminOverview,
  ApiEnvelope,
  AuditLog,
  AuditLogParams,
  ClinicClosure,
  ClinicHour,
  ClinicSettings,
  Doctor,
  DoctorAvailability,
  ListPayload,
  ScheduleException,
  Service,
  StaffMember,
} from "./types";

export const serviceFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a service name."),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  description: z.string().trim().max(500).optional(),
  durationMinutes: z.number().int().min(5, "At least 5 minutes."),
  bufferBeforeMinutes: z.number().int().min(0),
  bufferAfterMinutes: z.number().int().min(0),
  fee: z.number().min(0, "Fee cannot be negative."),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0),
});

export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the doctor's display name."),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  credentials: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  photoUrl: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  isActive: z.boolean(),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
});

export const staffInviteSchema = z.object({
  name: z.string().trim().min(2, "Enter a name."),
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(["DOCTOR", "RECEPTIONIST", "ADMIN"]),
});

export const closureSchema = z.object({
  date: z.string().min(1, "Choose a date."),
  reason: z.string().trim().max(200).optional(),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(2, "Enter the clinic name."),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  cancellationCutoffHours: z.number().int().min(0).max(168).optional(),
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
export type DoctorFormInput = z.infer<typeof doctorFormSchema>;
export type StaffInviteInput = z.infer<typeof staffInviteSchema>;
export type ClosureInput = z.infer<typeof closureSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

/**
 * The API keeps a staff account name and a public display name. The form
 * collects one name, so create sends it as both; updates only change the
 * public profile.
 */
function createDoctorPayload(input: DoctorFormInput) {
  return {
    email: input.email?.trim(),
    name: input.name.trim(),
    displayName: input.name.trim(),
    slug: input.slug.trim(),
    credentials: input.credentials?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
    photoUrl: input.photoUrl?.trim() || undefined,
    isActive: input.isActive,
  };
}

function updateDoctorPayload(input: Partial<DoctorFormInput>) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.displayName = input.name.trim();
  if (input.slug !== undefined) body.slug = input.slug.trim();
  if (input.credentials !== undefined) {
    body.credentials = input.credentials.trim() || null;
  }
  if (input.bio !== undefined) body.bio = input.bio.trim() || null;
  if (input.photoUrl !== undefined) {
    body.photoUrl = input.photoUrl.trim() || null;
  }
  if (input.isActive !== undefined) body.isActive = input.isActive;
  return body;
}

type WireRecord = Record<string, unknown>;

function asRecord(value: unknown): WireRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as WireRecord)
    : null;
}

/** The API uses `isOpen`; the schedule UI uses `open`. Adapt at the boundary. */
function toClientHour(value: WireRecord): ClinicHour {
  return {
    weekday: value.weekday as number | string,
    open: Boolean(value.isOpen ?? value.open),
    openTime: (value.openTime as string | null | undefined) ?? null,
    closeTime: (value.closeTime as string | null | undefined) ?? null,
  };
}

function mapHourPayload(payload: ListPayload<ClinicHour>): ListPayload<ClinicHour> {
  if (Array.isArray(payload)) {
    return payload.map((hour) => toClientHour(hour as unknown as WireRecord));
  }
  const hours = asRecord(payload)?.hours;
  if (Array.isArray(hours)) {
    return {
      ...payload,
      hours: hours.map((hour) => toClientHour(hour as WireRecord)),
    } as ListPayload<ClinicHour>;
  }
  return payload;
}

function mapClosurePayload(
  payload: ListPayload<ClinicClosure>,
): ListPayload<ClinicClosure> {
  const toClientClosure = (value: WireRecord): ClinicClosure => ({
    ...value,
    date:
      (value.date as string | undefined) ??
      (value.startsOn as string | undefined) ??
      "",
  }) as ClinicClosure;

  if (Array.isArray(payload)) {
    return payload.map((row) => toClientClosure(row as unknown as WireRecord));
  }
  const closures = asRecord(payload)?.closures;
  if (Array.isArray(closures)) {
    return {
      ...payload,
      closures: closures.map((row) => toClientClosure(row as WireRecord)),
    } as ListPayload<ClinicClosure>;
  }
  return payload;
}

/** Some endpoints wrap their list under a resource-specific key. */
function unwrapKeyedList<T>(
  envelope: ApiEnvelope<ListPayload<T>>,
  key: string,
): ApiEnvelope<ListPayload<T>> {
  const payload = envelope.data;
  const rows = Array.isArray(payload) ? payload : asRecord(payload)?.[key];
  return { ...envelope, data: Array.isArray(rows) ? (rows as T[]) : [] };
}

function unwrapSettings(
  envelope: ApiEnvelope<{ settings: ClinicSettings } | ClinicSettings>,
): ApiEnvelope<ClinicSettings> {
  const payload = envelope.data;
  const settings =
    payload && asRecord(payload)?.settings
      ? (payload as { settings: ClinicSettings }).settings
      : (payload as ClinicSettings);
  return { ...envelope, data: settings };
}

export const adminService = {
  async getOverview(): Promise<ApiEnvelope<AdminOverview>> {
    const response = await api.get<ApiEnvelope<AdminOverview>>("/admin/overview");
    return response.data;
  },

  async getServices(): Promise<ApiEnvelope<ListPayload<Service>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Service>>>(
      "/admin/services",
    );
    return response.data;
  },

  async createService(
    input: ServiceFormInput,
  ): Promise<ApiEnvelope<{ service: Service }>> {
    const response = await api.post<ApiEnvelope<{ service: Service }>>(
      "/admin/services",
      input,
    );
    return response.data;
  },

  async updateService(
    id: string,
    input: Partial<ServiceFormInput>,
  ): Promise<ApiEnvelope<{ service: Service }>> {
    const response = await api.patch<ApiEnvelope<{ service: Service }>>(
      `/admin/services/${id}`,
      input,
    );
    return response.data;
  },

  async getDoctors(): Promise<ApiEnvelope<ListPayload<Doctor>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Doctor>>>(
      "/admin/doctors",
    );
    return response.data;
  },

  async createDoctor(
    input: DoctorFormInput,
  ): Promise<ApiEnvelope<{ doctor: Doctor }>> {
    const response = await api.post<ApiEnvelope<{ doctor: Doctor }>>(
      "/admin/doctors",
      createDoctorPayload(input),
    );
    return response.data;
  },

  async updateDoctor(
    id: string,
    input: Partial<DoctorFormInput>,
  ): Promise<ApiEnvelope<{ doctor: Doctor }>> {
    const response = await api.patch<ApiEnvelope<{ doctor: Doctor }>>(
      `/admin/doctors/${id}`,
      updateDoctorPayload(input),
    );
    return response.data;
  },

  async setDoctorServices(
    id: string,
    serviceIds: string[],
  ): Promise<ApiEnvelope<{ serviceIds: string[] }>> {
    const response = await api.put<ApiEnvelope<{ serviceIds: string[] }>>(
      `/admin/doctors/${id}/services`,
      { serviceIds },
    );
    return response.data;
  },

  async getClinicHours(): Promise<ApiEnvelope<ListPayload<ClinicHour>>> {
    const response = await api.get<ApiEnvelope<ListPayload<ClinicHour>>>(
      "/admin/clinic-hours",
    );
    return { ...response.data, data: mapHourPayload(response.data.data) };
  },

  async updateClinicHours(
    hours: ClinicHour[],
  ): Promise<ApiEnvelope<ListPayload<ClinicHour>>> {
    const response = await api.put<ApiEnvelope<ListPayload<ClinicHour>>>(
      "/admin/clinic-hours",
      {
        hours: hours.map((hour) => ({
          weekday: hour.weekday,
          isOpen: hour.open,
          openTime: hour.openTime || null,
          closeTime: hour.closeTime || null,
        })),
      },
    );
    return { ...response.data, data: mapHourPayload(response.data.data) };
  },

  async getClosures(): Promise<ApiEnvelope<ListPayload<ClinicClosure>>> {
    const response = await api.get<ApiEnvelope<ListPayload<ClinicClosure>>>(
      "/admin/closures",
    );
    return { ...response.data, data: mapClosurePayload(response.data.data) };
  },

  async createClosure(
    input: ClosureInput,
  ): Promise<ApiEnvelope<{ closure: ClinicClosure }>> {
    const response = await api.post<ApiEnvelope<{ closure: ClinicClosure }>>(
      "/admin/closures",
      {
        startsOn: input.date,
        endsOn: input.date,
        reason: input.reason,
      },
    );
    return response.data;
  },

  async deleteClosure(id: string): Promise<ApiEnvelope<{ deleted: true }>> {
    const response = await api.delete<ApiEnvelope<{ deleted: true }>>(
      `/admin/closures/${id}`,
    );
    return response.data;
  },

  async getDoctorAvailability(
    id: string,
  ): Promise<ApiEnvelope<ListPayload<DoctorAvailability>>> {
    const response = await api.get<ApiEnvelope<ListPayload<DoctorAvailability>>>(
      `/admin/doctors/${id}/availability`,
    );
    return unwrapKeyedList(response.data, "windows");
  },

  async updateDoctorAvailability(
    id: string,
    windows: DoctorAvailability[],
  ): Promise<ApiEnvelope<ListPayload<DoctorAvailability>>> {
    const response = await api.put<ApiEnvelope<ListPayload<DoctorAvailability>>>(
      `/admin/doctors/${id}/availability`,
      { windows },
    );
    return unwrapKeyedList(response.data, "windows");
  },

  async createDoctorException(
    id: string,
    input: {
      date: string;
      startTime: string;
      endTime: string;
      type: string;
      reason?: string;
    },
  ): Promise<ApiEnvelope<{ exception: ScheduleException }>> {
    const response = await api.post<ApiEnvelope<{ exception: ScheduleException }>>(
      `/admin/doctors/${id}/exceptions`,
      input,
    );
    return response.data;
  },

  async getStaff(): Promise<ApiEnvelope<ListPayload<StaffMember>>> {
    const response = await api.get<ApiEnvelope<ListPayload<StaffMember>>>(
      "/admin/staff",
    );
    return response.data;
  },

  async inviteStaff(
    input: StaffInviteInput,
  ): Promise<ApiEnvelope<StaffMember>> {
    const response = await api.post<ApiEnvelope<StaffMember>>(
      "/admin/staff",
      input,
    );
    return response.data;
  },

  async updateStaff(
    id: string,
    input: { status?: string; role?: string },
  ): Promise<ApiEnvelope<StaffMember>> {
    const response = await api.patch<ApiEnvelope<StaffMember>>(
      `/admin/staff/${id}`,
      input,
    );
    return response.data;
  },

  async getSettings(): Promise<ApiEnvelope<ClinicSettings>> {
    const response = await api.get<
      ApiEnvelope<{ settings: ClinicSettings } | ClinicSettings>
    >("/admin/settings");
    return unwrapSettings(response.data);
  },

  async updateSettings(
    input: Partial<SettingsInput>,
  ): Promise<ApiEnvelope<ClinicSettings>> {
    // The API rejects an empty email and strips unsupported keys; normalize
    // both here so the settings form only sends fields the backend persists.
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.address !== undefined) body.address = input.address;
    if (input.phone !== undefined) body.phone = input.phone;
    if (input.cancellationCutoffHours !== undefined) {
      body.cancellationCutoffHours = input.cancellationCutoffHours;
    }
    if (input.email !== undefined) body.email = input.email.trim() || null;
    const response = await api.patch<
      ApiEnvelope<{ settings: ClinicSettings } | ClinicSettings>
    >("/admin/settings", body);
    return unwrapSettings(response.data);
  },

  async getAuditLogs(
    params: AuditLogParams = {},
  ): Promise<ApiEnvelope<ListPayload<AuditLog>>> {
    // The API uses `limit` and an inclusive from/to date range.
    const query: Record<string, string | number | undefined> = {
      page: params.page,
      limit: params.limit,
      action: params.action,
      from: params.from,
      to: params.to,
    };
    const response = await api.get<ApiEnvelope<ListPayload<AuditLog>>>(
      "/admin/audit-logs",
      { params: query },
    );
    return response.data;
  },
};
