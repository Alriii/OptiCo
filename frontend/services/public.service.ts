import api from "@/lib/axios";
import type {
  ApiEnvelope,
  AvailabilityResponse,
  ClinicInfo,
  Doctor,
  ListPayload,
  Service,
} from "./types";

// Authenticated patient scheduling input.
export interface PatientBookingInput {
  serviceId: string;
  startAt: string;
  note?: string;
}

export interface BookingResult {
  id: string;
  reference: string;
  status: string;
  requestedStartAt: string;
  serviceName: string;
}

type WireRecord = Record<string, unknown>;

function asRecord(value: unknown): WireRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as WireRecord)
    : null;
}

// Normalize clinic operating hours.
function mapClinicInfo(payload: ClinicInfo): ClinicInfo {
  if (!Array.isArray(payload?.hours)) return payload;
  return {
    ...payload,
    hours: payload.hours.map((hour) => ({
      ...hour,
      open: Boolean(
        (hour as unknown as WireRecord).isOpen ?? hour.open,
      ),
    })),
  };
}

// Normalize doctor payload structures.
function mapDoctorsPayload(payload: ListPayload<Doctor>): ListPayload<Doctor> {
  const toClientDoctor = (doctor: Doctor): Doctor => {
    const services = doctor.services as unknown as Array<Service | string>;
    if (!Array.isArray(services)) return doctor;
    return {
      ...doctor,
      services: services.map((service) =>
        typeof service === "string" ? { id: service, name: service } : service,
      ),
    };
  };

  if (Array.isArray(payload)) return payload.map(toClientDoctor);
  const doctors = asRecord(payload)?.doctors;
  if (Array.isArray(doctors)) {
    return {
      ...payload,
      doctors: (doctors as Doctor[]).map(toClientDoctor),
    } as ListPayload<Doctor>;
  }
  return payload;
}

export const publicService = {
  async getClinic(): Promise<ApiEnvelope<ClinicInfo>> {
    const response = await api.get<ApiEnvelope<ClinicInfo>>("/public/clinic");
    return { ...response.data, data: mapClinicInfo(response.data.data) };
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
    return { ...response.data, data: mapDoctorsPayload(response.data.data) };
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
};
