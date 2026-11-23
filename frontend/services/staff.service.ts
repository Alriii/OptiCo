import api from "@/lib/axios";
import type {
  ApiEnvelope,
  Appointment,
  ListPayload,
  PaginationParams,
  PatientProfile,
  Payment,
  StaffAppointmentParams,
  WalkIn,
} from "./types";

export interface WalkInPatientInput {
  fullName: string;
  email: string;
  mobile?: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
}

export interface WalkInInput {
  patient: WalkInPatientInput;
  serviceId?: string;
  immediate?: boolean;
}

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "EWALLET"
  | "OTHER";

export interface PaymentInput {
  appointmentId: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber?: string;
  paidAt?: string;
  note?: string;
}

export const staffService = {
  async getAppointments(
    params: StaffAppointmentParams = {},
  ): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Appointment>>>(
      "/staff/appointments",
      { params },
    );
    return response.data;
  },

  async getAppointment(id: string): Promise<ApiEnvelope<Appointment>> {
    const response = await api.get<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}`,
    );
    return response.data;
  },

  async approve(id: string): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}/approve`,
    );
    return response.data;
  },

  async reject(id: string, reason: string): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}/reject`,
      { reason },
    );
    return response.data;
  },

  async cancel(id: string, reason: string): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}/cancel`,
      { reason },
    );
    return response.data;
  },

  async reschedule(
    id: string,
    input: { startAt: string; reason?: string },
  ): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}/reschedule`,
      input,
    );
    return response.data;
  },

  async checkIn(id: string): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}/check-in`,
    );
    return response.data;
  },

  async complete(id: string): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}/complete`,
    );
    return response.data;
  },

  async noShow(id: string): Promise<ApiEnvelope<Appointment>> {
    const response = await api.post<ApiEnvelope<Appointment>>(
      `/staff/appointments/${id}/no-show`,
    );
    return response.data;
  },

  async searchPatients(
    q: string,
  ): Promise<ApiEnvelope<ListPayload<PatientProfile>>> {
    const response = await api.get<ApiEnvelope<ListPayload<PatientProfile>>>(
      "/staff/patients",
      { params: { q } },
    );
    return response.data;
  },

  async createWalkIn(input: WalkInInput): Promise<ApiEnvelope<WalkIn>> {
    const response = await api.post<ApiEnvelope<WalkIn>>(
      "/staff/walk-ins",
      input,
    );
    return response.data;
  },

  async getWalkIns(date: string): Promise<ApiEnvelope<ListPayload<WalkIn>>> {
    const response = await api.get<ApiEnvelope<ListPayload<WalkIn>>>(
      "/staff/walk-ins",
      { params: { date } },
    );
    return response.data;
  },

  async callWalkIn(id: string): Promise<ApiEnvelope<WalkIn>> {
    const response = await api.post<ApiEnvelope<WalkIn>>(
      `/staff/walk-ins/${id}/call`,
    );
    return response.data;
  },

  async startWalkIn(id: string): Promise<ApiEnvelope<WalkIn>> {
    const response = await api.post<ApiEnvelope<WalkIn>>(
      `/staff/walk-ins/${id}/start`,
    );
    return response.data;
  },

  async completeWalkIn(id: string): Promise<ApiEnvelope<WalkIn>> {
    const response = await api.post<ApiEnvelope<WalkIn>>(
      `/staff/walk-ins/${id}/complete`,
    );
    return response.data;
  },

  async cancelWalkIn(id: string): Promise<ApiEnvelope<WalkIn>> {
    const response = await api.post<ApiEnvelope<WalkIn>>(
      `/staff/walk-ins/${id}/cancel`,
    );
    return response.data;
  },

  async recordPayment(
    input: PaymentInput,
  ): Promise<ApiEnvelope<{ payment: Payment; balance?: unknown }>> {
    const response = await api.post<
      ApiEnvelope<{ payment: Payment; balance?: unknown }>
    >("/staff/payments", input);
    return response.data;
  },

  async getPayments(
    appointmentId?: string,
  ): Promise<ApiEnvelope<ListPayload<Payment>>> {
    const response = await api.get<ApiEnvelope<ListPayload<Payment>>>(
      "/staff/payments",
      { params: appointmentId ? { appointmentId } : undefined },
    );
    return response.data;
  },

  async getPendingQueue(
    params: PaginationParams = {},
  ): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    return staffService.getAppointments({ ...params, status: "PENDING" });
  },
};
