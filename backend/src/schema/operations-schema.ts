import { z } from "zod";
import { patientDetails } from "@/schema/public-schema";
import { paginationQuery } from "@/schema/common-schema";

export const walkInQuerySchema = z.object({
  query: z.object({
    date: z.iso.date().optional(),
  }),
});

export const registerWalkInSchema = z.object({
  body: z.object({
    patient: patientDetails,
    serviceId: z.uuid().optional(),
    immediate: z.boolean().optional(),
  }),
});

export const startWalkInSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    doctorId: z.uuid().optional(),
  }),
});

export const patientSearchSchema = z.object({
  query: z.object({
    ...paginationQuery,
    q: z.string().trim().max(120).optional(),
  }),
});
