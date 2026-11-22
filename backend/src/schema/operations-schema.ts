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

export const paymentQuerySchema = z.object({
  query: z.object({
    appointmentId: z.uuid("A valid appointment id is required"),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    appointmentId: z.uuid("A valid appointment id is required"),
    amount: z.coerce.number().positive("Amount must be greater than zero").max(10_000_000),
    method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "EWALLET", "OTHER"]),
    receiptNumber: z.string().trim().max(80).optional(),
    note: z.string().trim().max(300).optional(),
    paidAt: z.iso.datetime({ offset: true }).optional(),
  }),
});

export const reversePaymentSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    reason: z.string().trim().min(3, "A reason is required").max(300),
  }),
});

export const patientSearchSchema = z.object({
  query: z.object({
    ...paginationQuery,
    q: z.string().trim().max(120).optional(),
  }),
});
