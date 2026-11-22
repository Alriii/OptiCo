import { z } from "zod";

export const patientProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    mobile: z
      .string()
      .trim()
      .max(32)
      .regex(/^[0-9+()\-\s]{7,32}$/, "Mobile number format is invalid")
      .nullable()
      .optional(),
    dateOfBirth: z.iso.date().nullable().optional(),
    guardianName: z.string().trim().max(120).nullable().optional(),
    guardianRelationship: z.string().trim().max(60).nullable().optional(),
    guardianContact: z.string().trim().max(60).nullable().optional(),
  }),
});
