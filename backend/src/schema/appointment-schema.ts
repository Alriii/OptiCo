import { z } from "zod";
import { dateQuery, paginationQuery } from "@/schema/common-schema";

const statuses = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const appointmentStatusSchema = z.enum(statuses);

export const createAppointmentSchema = z.object({
  body: z.object({
    serviceId: z.uuid("A valid service id is required"),
    startAt: z.iso.datetime({ offset: true, message: "startAt must be an ISO timestamp" }),
    note: z.string().trim().max(500).optional(),
  }),
});

export const staffAppointmentQuerySchema = z.object({
  query: z.object({
    ...paginationQuery,
    status: appointmentStatusSchema.optional(),
    date: dateQuery.optional(),
    q: z.string().trim().max(120).optional(),
  }),
});

export const appointmentReasonSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    reason: z.string().trim().min(3, "A reason is required").max(300),
  }),
});

export const optionalReasonSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    reason: z.string().trim().max(300).optional(),
  }),
});

export const rescheduleSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    startAt: z.iso.datetime({ offset: true, message: "startAt must be an ISO timestamp" }),
  }),
});

export const doctorStatusSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    status: z.enum(["CHECKED_IN", "IN_PROGRESS", "COMPLETED", "NO_SHOW"]),
    reason: z.string().trim().max(300).optional(),
  }),
});

export const doctorScheduleQuerySchema = z.object({
  query: z.object({
    date: dateQuery.optional(),
  }),
});
