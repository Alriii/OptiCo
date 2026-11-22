import { z } from "zod";
import api from "@/lib/axios";
import type {
  ApiEnvelope,
  Appointment,
  AvailabilityResponse,
  ClinicInfo,
  Doctor,
  Guardian,
  ListPayload,
  Service,
} from "./types";

export const bookingDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the patient's full name."),
  email: z.string().trim().email("Enter a valid email address."),
  mobile: z
    .string()
    .trim()
    .min(7, "Enter a mobile number.")
    .max(20, "Mobile number is too long."),
  dateOfBirth: z.string().optional(),
  note: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters.")
    .optional(),
  guardianName: z.string().trim().optional(),
  guardianRelationship: z.string().trim().optional(),
  guardianContact: z.string().trim().optional(),
});

export type BookingDetails = z.infer<typeof bookingDetailsSchema>;

export interface BookingRequestInput extends BookingDetails {
  serviceId: string;
  startAt: string;
  guardian?: Guardian | null;
}

export const publicService = {
  async getClinic(): Promise<ApiEnvelope<ClinicInfo>> {
    const response = await api.get<ApiEnvelope<ClinicInfo>>("/public/clinic");
    return response.data;
  },

  async getServices(): Promise<ApiEnvelope<ListPayload<Service>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Service>>>(
      "/public/services",
    );
    return response.data;
  },

  async getDoctors(): Promise<ApiEnvelope<ListPayload<Doctor>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Doctor>>>(
      "/public/doctors",
    );
    return response.data;
  },

  async getDoctor(slug: string): Promise<ApiEnvelope<Doctor>> {
    const response = await api.get<ApiEnvelope<Doctor>>(
      `/public/doctors/${encodeURIComponent(slug)}`,
    );
    return response.data;
  },

  async getAvailability(
    serviceId: string,
    date: string,
  ): Promise<ApiEnvelope<AvailabilityResponse>> {
    const response = await api.get<ApiEnvelope<AvailabilityResponse>>(
      "/public/availability",
      { params: { serviceId, date } },
    );
    return response.data;
  },

  async createAppointment(
    input: BookingRequestInput,
  ): Promise<ApiEnvelope<{ appointment?: Appointment; reference?: string }>> {
    const response = await api.post<
      ApiEnvelope<{ appointment?: Appointment; reference?: string }>
    >("/public/appointments", input);
    return response.data;
  },
};
