import { z } from "zod";

const patientDetails = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.email("A valid email is required"),
  mobile: z
    .string()
    .trim()
    .max(32)
    .regex(/^[0-9+()\-\s]{7,32}$/, "Mobile number format is invalid")
    .optional(),
  dateOfBirth: z.iso.date("Date of birth must be YYYY-MM-DD").optional(),
  guardianName: z.string().trim().max(120).optional(),
  guardianRelationship: z.string().trim().max(60).optional(),
  guardianContact: z.string().trim().max(60).optional(),
});

export const availabilityQuerySchema = z.object({
  query: z.object({
    serviceId: z.uuid("A valid service id is required"),
    date: z.iso.date("Date must be YYYY-MM-DD"),
  }),
});

export const guestBookingSchema = z.object({
  body: z.object({
    serviceId: z.uuid("A valid service id is required"),
    startAt: z.iso.datetime({ offset: true, message: "startAt must be an ISO timestamp" }),
    note: z.string().trim().max(500).optional(),
    patient: patientDetails,
  }),
});

export const guestExchangeSchema = z.object({
  body: z.object({
    token: z.string().min(20, "Token is required").max(200),
  }),
});

export const guestCancelSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300).optional(),
  }),
});

export { patientDetails };
