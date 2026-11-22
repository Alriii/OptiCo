import { z } from "zod";
import api, { clearCsrfToken, refreshCsrfToken } from "@/lib/axios";
import type { ApiEnvelope, AuthUser } from "./types";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invitation token is required."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const authService = {
  async getCsrfToken(): Promise<ApiEnvelope<{ csrfToken: string }>> {
    const response = await api.get<ApiEnvelope<{ csrfToken: string }>>(
      "/auth/csrf-token",
    );
    return response.data;
  },

  async login(input: LoginInput): Promise<ApiEnvelope<{ user?: AuthUser }>> {
    const response = await api.post<ApiEnvelope<{ user?: AuthUser }>>(
      "/auth/login",
      input,
    );
    // The refresh cookie and CSRF pair rotate on login.
    await refreshCsrfToken();
    return response.data;
  },

  async signup(input: SignupInput): Promise<ApiEnvelope<{ user?: AuthUser }>> {
    const response = await api.post<ApiEnvelope<{ user?: AuthUser }>>(
      "/auth/signup",
      input,
    );
    return response.data;
  },

  async logout(): Promise<ApiEnvelope<null>> {
    const response = await api.post<ApiEnvelope<null>>("/auth/logout");
    clearCsrfToken();
    await refreshCsrfToken();
    return response.data;
  },

  async refresh(): Promise<ApiEnvelope<{ user?: AuthUser }>> {
    const response = await api.post<ApiEnvelope<{ user?: AuthUser }>>(
      "/auth/refresh",
    );
    return response.data;
  },

  async session(): Promise<ApiEnvelope<{ user: AuthUser }>> {
    const response = await api.get<ApiEnvelope<{ user: AuthUser }>>(
      "/auth/session",
    );
    return response.data;
  },

  async acceptInvite(
    input: AcceptInviteInput,
  ): Promise<ApiEnvelope<{ user?: AuthUser }>> {
    const response = await api.post<ApiEnvelope<{ user?: AuthUser }>>(
      "/auth/accept-invite",
      input,
    );
    await refreshCsrfToken();
    return response.data;
  },
};
