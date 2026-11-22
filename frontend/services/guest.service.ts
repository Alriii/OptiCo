import api from "@/lib/axios";
import type { ApiEnvelope, Appointment } from "./types";

export const guestService = {
  async exchange(
    token: string,
  ): Promise<ApiEnvelope<{ appointment?: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment?: Appointment }>>(
      "/public/guest/exchange",
      { token },
    );
    return response.data;
  },

  async getAppointment(): Promise<ApiEnvelope<Appointment>> {
    const response = await api.get<ApiEnvelope<Appointment>>(
      "/public/guest/appointment",
    );
    return response.data;
  },

  async cancelRequest(reason?: string): Promise<ApiEnvelope<unknown>> {
    const response = await api.post<ApiEnvelope<unknown>>(
      "/public/guest/cancel-request",
      { reason },
    );
    return response.data;
  },
};
