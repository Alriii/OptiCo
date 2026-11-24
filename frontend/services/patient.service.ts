import { z } from "zod";
import api from "@/lib/axios";
import type {
  ApiEnvelope,
  Appointment,
  ListPayload,
  PatientProfile,
} from "./types";
import type { BookingResult, PatientBookingInput } from "./public.service";

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

// Unwrap nested patient response.
function unwrapPatient(
  envelope: ApiEnvelope<{ patient: PatientProfile } | PatientProfile>,
): ApiEnvelope<PatientProfile> {
  const payload = envelope.data;
  const patient =
    payload && "patient" in payload && payload.patient
      ? payload.patient
      : (payload as PatientProfile);
  return { ...envelope, data: patient };
}

export const patientService = {
  async getProfile(): Promise<ApiEnvelope<PatientProfile>> {
    const response = await api.get<
      ApiEnvelope<{ patient: PatientProfile } | PatientProfile>
    >("/patient/profile");
    return unwrapPatient(response.data);
  },

  async updateProfile(
    input: ProfileInput,
  ): Promise<ApiEnvelope<PatientProfile>> {
    // Omit immutable authentication email.
    const profileInput = {
      fullName: input.fullName,
      mobile: input.mobile,
      dateOfBirth: input.dateOfBirth,
    };
    const response = await api.patch<
      ApiEnvelope<{ patient: PatientProfile } | PatientProfile>
    >("/patient/profile", profileInput);
    return unwrapPatient(response.data);
  },

  async getAppointments(): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Appointment>>>(
      "/patient/appointments",
    );
    return response.data;
  },

  async requestAppointment(
    input: PatientBookingInput,
  ): Promise<ApiEnvelope<BookingResult>> {
    const response = await api.post<ApiEnvelope<BookingResult>>(
      "/patient/appointments",
      input,
    );
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
    input: { startAt: string },
  ): Promise<ApiEnvelope<unknown>> {
    const response = await api.post<ApiEnvelope<unknown>>(
      `/patient/appointments/${id}/reschedule-request`,
      { startAt: input.startAt },
    );
    return response.data;
  },
};
