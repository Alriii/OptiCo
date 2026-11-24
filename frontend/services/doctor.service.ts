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
    const payload = response.data.data;
    const windows = Array.isArray(payload)
      ? payload
      : (payload as { windows?: DoctorAvailability[] })?.windows;
    return { ...response.data, data: Array.isArray(windows) ? windows : [] };
  },

  async updateStatus(
    id: string,
    status: string,
    reason?: string,
  ): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/doctor/appointments/${id}/status`,
      { status, reason },
    );
    return response.data;
  },
};
