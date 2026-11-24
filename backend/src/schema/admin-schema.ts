import { z } from "zod";
import { normalizeTime, TIME_PATTERN } from "@/lib/time";
import { paginationQuery } from "@/schema/common-schema";

const fee = z.union([z.string().regex(/^\d+(\.\d{1,2})?$/, "Fee must be a decimal amount"), z.coerce.number().min(0)]);

const time = z
  .string()
  .regex(TIME_PATTERN, "Time must be HH:MM or HH:MM:SS")
  .transform(normalizeTime);

export const createServiceSchema = z.object({
  body: z.object({
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or dashes"),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional(),
    durationMinutes: z.coerce.number().int().min(5).max(480),
    bufferBeforeMinutes: z.coerce.number().int().min(0).max(120).default(0),
    bufferAfterMinutes: z.coerce.number().int().min(0).max(120).default(0),
    fee,
    isActive: z.boolean().default(true),
    displayOrder: z.coerce.number().int().min(0).default(0),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
    bufferBeforeMinutes: z.coerce.number().int().min(0).max(120).optional(),
    bufferAfterMinutes: z.coerce.number().int().min(0).max(120).optional(),
    fee: fee.optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
  }),
});

export const createDoctorSchema = z.object({
  body: z.object({
    email: z.email(),
    name: z.string().trim().min(2).max(120),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
    displayName: z.string().trim().min(2).max(120),
    credentials: z.string().trim().max(160).optional(),
    bio: z.string().trim().max(1500).optional(),
    photoUrl: z.url().max(500).optional(),
    isActive: z.boolean().default(true),
    serviceIds: z.array(z.uuid()).optional(),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    displayName: z.string().trim().min(2).max(120).optional(),
    credentials: z.string().trim().max(160).nullable().optional(),
    bio: z.string().trim().max(1500).nullable().optional(),
    photoUrl: z.url().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
    serviceIds: z.array(z.uuid()).optional(),
  }),
});

export const doctorServicesSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    serviceIds: z.array(z.uuid()).max(100),
  }),
});

export const clinicHoursSchema = z.object({
  body: z.object({
    hours: z
      .array(
        z.object({
          weekday: z.coerce.number().int().min(0).max(6),
          isOpen: z.boolean(),
          openTime: time.nullable().optional(),
          closeTime: time.nullable().optional(),
        }),
      )
      .max(7),
  }),
});

export const closureSchema = z.object({
  body: z.object({
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
    reason: z.string().trim().max(300).optional(),
  }),
});

export const availabilitySchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    windows: z
      .array(
        z.object({
          weekday: z.coerce.number().int().min(0).max(6),
          startTime: time,
          endTime: time,
          breakStart: time.nullable().optional(),
          breakEnd: time.nullable().optional(),
          effectiveFrom: z.iso.date().nullable().optional(),
          effectiveUntil: z.iso.date().nullable().optional(),
        }),
      )
      .max(50),
  }),
});

export const exceptionSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    date: z.iso.date(),
    startTime: time,
    endTime: time,
    type: z.enum(["UNAVAILABLE", "ADDITIONAL", "TIME_OFF"]),
    reason: z.string().trim().max(300).optional(),
  }),
});

export const settingsSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
    phone: z.string().trim().max(60).nullable().optional(),
    email: z.email().nullable().optional(),
    cancellationCutoffHours: z.coerce.number().int().min(0).max(720).optional(),
    guestLinkTtlHours: z.coerce.number().int().min(1).max(720).optional(),
  }),
});

export const auditQuerySchema = z.object({
  query: z.object({
    ...paginationQuery,
    entityType: z.string().trim().max(60).optional(),
    action: z.string().trim().max(120).optional(),
    actorUserId: z.uuid().optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  }),
});
