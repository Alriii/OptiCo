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
  active: z.boolean(),
  displayOrder: z.number().int().min(0),
});

export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the doctor's display name."),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  title: z.string().trim().max(120).optional(),
  credentials: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  photoUrl: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  active: z.boolean(),
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
  bookingNoticeHours: z.number().int().min(0).max(168).optional(),
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
export type DoctorFormInput = z.infer<typeof doctorFormSchema>;
export type StaffInviteInput = z.infer<typeof staffInviteSchema>;
export type ClosureInput = z.infer<typeof closureSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

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
  ): Promise<ApiEnvelope<Service>> {
    const response = await api.post<ApiEnvelope<Service>>(
      "/admin/services",
      input,
    );
    return response.data;
  },

  async updateService(
    id: string,
    input: Partial<ServiceFormInput>,
  ): Promise<ApiEnvelope<Service>> {
    const response = await api.patch<ApiEnvelope<Service>>(
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
  ): Promise<ApiEnvelope<Doctor>> {
    const response = await api.post<ApiEnvelope<Doctor>>(
      "/admin/doctors",
      input,
    );
    return response.data;
  },

  async updateDoctor(
    id: string,
    input: Partial<DoctorFormInput>,
  ): Promise<ApiEnvelope<Doctor>> {
    const response = await api.patch<ApiEnvelope<Doctor>>(
      `/admin/doctors/${id}`,
      input,
    );
    return response.data;
  },

  async setDoctorServices(
    id: string,
    serviceIds: string[],
  ): Promise<ApiEnvelope<Doctor>> {
    const response = await api.put<ApiEnvelope<Doctor>>(
      `/admin/doctors/${id}/services`,
      { serviceIds },
    );
    return response.data;
  },

  async getClinicHours(): Promise<ApiEnvelope<ListPayload<ClinicHour>>> {
    const response = await api.get<ApiEnvelope<ListPayload<ClinicHour>>>(
      "/admin/clinic-hours",
    );
    return response.data;
  },

  async updateClinicHours(
    hours: ClinicHour[],
  ): Promise<ApiEnvelope<ListPayload<ClinicHour>>> {
    const response = await api.put<ApiEnvelope<ListPayload<ClinicHour>>>(
      "/admin/clinic-hours",
      { hours },
    );
    return response.data;
  },

  async getClosures(): Promise<ApiEnvelope<ListPayload<ClinicClosure>>> {
    const response = await api.get<ApiEnvelope<ListPayload<ClinicClosure>>>(
      "/admin/closures",
    );
    return response.data;
  },

  async createClosure(
    input: ClosureInput,
  ): Promise<ApiEnvelope<ClinicClosure>> {
    const response = await api.post<ApiEnvelope<ClinicClosure>>(
      "/admin/closures",
      input,
    );
    return response.data;
  },

  async deleteClosure(id: string): Promise<ApiEnvelope<null>> {
    const response = await api.delete<ApiEnvelope<null>>(
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
    return response.data;
  },

  async updateDoctorAvailability(
    id: string,
    days: DoctorAvailability[],
  ): Promise<ApiEnvelope<ListPayload<DoctorAvailability>>> {
    const response = await api.put<ApiEnvelope<ListPayload<DoctorAvailability>>>(
      `/admin/doctors/${id}/availability`,
      { days },
    );
    return response.data;
  },

  async createDoctorException(
    id: string,
    input: { date: string; type: string; reason?: string },
  ): Promise<ApiEnvelope<ScheduleException>> {
    const response = await api.post<ApiEnvelope<ScheduleException>>(
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
    const response = await api.get<ApiEnvelope<ClinicSettings>>(
      "/admin/settings",
    );
    return response.data;
  },

  async updateSettings(
    input: Partial<SettingsInput> & Record<string, unknown>,
  ): Promise<ApiEnvelope<ClinicSettings>> {
    const response = await api.patch<ApiEnvelope<ClinicSettings>>(
      "/admin/settings",
      input,
    );
    return response.data;
  },

  async getAuditLogs(
    params: AuditLogParams = {},
  ): Promise<ApiEnvelope<ListPayload<AuditLog>>> {
    const response = await api.get<ApiEnvelope<ListPayload<AuditLog>>>(
      "/admin/audit-logs",
      { params },
    );
    return response.data;
  },
};
