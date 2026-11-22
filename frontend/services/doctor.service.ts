import api from "@/lib/axios";
import type {
  ApiEnvelope,
  Appointment,
  DoctorAvailability,
  ListPayload,
} from "./types";

export const doctorService = {
  async getSchedule(date: string): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Appointment>>>(
      "/doctor/schedule",
      { params: { date } },
    );
    return response.data;
  },

  async getAppointments(): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Appointment>>>(
      "/doctor/appointments",
    );
    return response.data;
  },

  async getAvailability(): Promise<
    ApiEnvelope<ListPayload<DoctorAvailability>>
  > {
    const response = await api.get<ApiEnvelope<ListPayload<DoctorAvailability>>>(
      "/doctor/availability",
    );
    return response.data;
  },

  async updateStatus(
    id: string,
    status: string,
    reason?: string,
  ): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/doctor/appointments/${id}/status`,
      { status, reason },
    );
    return response.data;
  },
};
