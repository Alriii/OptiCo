import api from "@/lib/axios";
import type {
  ApiEnvelope,
  Appointment,
  ListPayload,
  PaginationParams,
  PatientProfile,
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

export const staffService = {
  async getAppointments(
    params: StaffAppointmentParams = {},
  ): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    const { pageSize, ...rest } = params as StaffAppointmentParams & {
      pageSize?: number;
    };
    const response = await api.get<ApiEnvelope<ListPayload<Appointment>>>(
      "/staff/appointments",
      { params: { ...rest, limit: pageSize ?? params.limit } },
    );
    return response.data;
  },

  async getAppointment(id: string): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.get<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}`,
    );
    return response.data;
  },

  async approve(id: string): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}/approve`,
    );
    return response.data;
  },

  async reject(id: string, reason: string): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}/reject`,
      { reason },
    );
    return response.data;
  },

  async cancel(id: string, reason: string): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}/cancel`,
      { reason },
    );
    return response.data;
  },

  async reschedule(
    id: string,
    input: { startAt: string },
  ): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}/reschedule`,
      { startAt: input.startAt },
    );
    return response.data;
  },

  async checkIn(id: string): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}/check-in`,
    );
    return response.data;
  },

  async complete(id: string): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}/complete`,
    );
    return response.data;
  },

  async noShow(id: string): Promise<ApiEnvelope<{ appointment: Appointment }>> {
    const response = await api.post<ApiEnvelope<{ appointment: Appointment }>>(
      `/staff/appointments/${id}/no-show`,
    );
    return response.data;
  },

  async searchPatients(
    q: string,
  ): Promise<ApiEnvelope<{ patients: PatientProfile[] }>> {
    const response = await api.get<ApiEnvelope<{ patients: PatientProfile[] }>>(
      "/staff/patients",
      { params: { q } },
    );
    return response.data;
  },

  async createWalkIn(input: WalkInInput): Promise<
    ApiEnvelope<{
      patient: PatientProfile;
      appointment: Appointment | null;
      queueEntry: WalkIn | null;
    }>
  > {
    const response = await api.post<
      ApiEnvelope<{
        patient: PatientProfile;
        appointment: Appointment | null;
        queueEntry: WalkIn | null;
      }>
    >("/staff/walk-ins", input);
    return response.data;
  },

  async getWalkIns(date: string): Promise<ApiEnvelope<ListPayload<WalkIn>>> {
    const response = await api.get<ApiEnvelope<ListPayload<WalkIn>>>(
      "/staff/walk-ins",
      { params: { date } },
    );
    const entries = (response.data.data as { entries?: WalkIn[] })?.entries;
    return {
      ...response.data,
      data: Array.isArray(entries) ? entries : [],
    };
  },

  async callWalkIn(id: string): Promise<ApiEnvelope<{ entry: WalkIn }>> {
    const response = await api.post<ApiEnvelope<{ entry: WalkIn }>>(
      `/staff/walk-ins/${id}/call`,
    );
    return response.data;
  },

  async startWalkIn(id: string): Promise<ApiEnvelope<{ entry: WalkIn }>> {
    const response = await api.post<ApiEnvelope<{ entry: WalkIn }>>(
      `/staff/walk-ins/${id}/start`,
    );
    return response.data;
  },

  async completeWalkIn(id: string): Promise<ApiEnvelope<{ entry: WalkIn }>> {
    const response = await api.post<ApiEnvelope<{ entry: WalkIn }>>(
      `/staff/walk-ins/${id}/complete`,
    );
    return response.data;
  },

  async cancelWalkIn(id: string): Promise<ApiEnvelope<{ entry: WalkIn }>> {
    const response = await api.post<ApiEnvelope<{ entry: WalkIn }>>(
      `/staff/walk-ins/${id}/cancel`,
    );
    return response.data;
  },

  async getPendingQueue(
    params: PaginationParams = {},
  ): Promise<ApiEnvelope<ListPayload<Appointment>>> {
    return staffService.getAppointments({ ...params, status: "PENDING" });
  },
};
