import { z } from "zod";
import api from "@/lib/axios";
import type {
  ApiEnvelope,
  Appointment,
  ListPayload,
  PatientProfile,
} from "./types";
import type { BookingRequestInput } from "./public.service";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  mobile: z
    .string()
    .trim()
    .min(7, "Enter a mobile number.")
    .max(20, "Mobile number is too long."),
  dateOfBirth: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const patientService = {
  async getProfile(): Promise<ApiEnvelope<PatientProfile>> {
    const response = await api.get<ApiEnvelope<PatientProfile>>(
      "/patient/profile",
    );
    return response.data;
  },

  async updateProfile(
    input: ProfileInput,
  ): Promise<ApiEnvelope<PatientProfile>> {
    const response = await api.patch<ApiEnvelope<PatientProfile>>(
      "/patient/profile",
      input,
    );
    return response.data;
  },

  async getAppointments(): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Appointment>>>(
      "/patient/appointments",
    );
    return response.data;
  },

  async requestAppointment(
    input: BookingRequestInput,
  ): Promise<ApiEnvelope<{ appointment?: Appointment; reference?: string }>> {
    const response = await api.post<
      ApiEnvelope<{ appointment?: Appointment; reference?: string }>
    >("/patient/appointments", input);
    return response.data;
  },

  async requestCancellation(
    id: string,
    reason?: string,
  ): Promise<ApiEnvelope<unknown>> {
    const response = await api.post<ApiEnvelope<unknown>>(
      `/patient/appointments/${id}/cancel-request`,
      { reason },
    );
    return response.data;
  },

  async requestReschedule(
    id: string,
    input: { startAt: string; reason?: string },
  ): Promise<ApiEnvelope<unknown>> {
    const response = await api.post<ApiEnvelope<unknown>>(
      `/patient/appointments/${id}/reschedule-request`,
      input,
    );
    return response.data;
  },
};
