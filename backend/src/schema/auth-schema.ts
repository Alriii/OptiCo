import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    email: z.email("A valid email is required"),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email("A valid email is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(20, "Invitation token is required"),
    password,
  }),
});

export const createStaffSchema = z.object({
  body: z.object({
    email: z.email("A valid email is required"),
    name: z.string().trim().min(2).max(120),
    role: z.enum(["DOCTOR", "RECEPTIONIST", "ADMIN"]),
  }),
});

export const updateStaffSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    status: z.enum(["ACTIVE", "DISABLED"]).optional(),
    role: z.enum(["DOCTOR", "RECEPTIONIST", "ADMIN"]).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.uuid("A valid id is required") }),
});

export const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(20).optional(),
    })
    .optional(),
});
