import axios from "axios";

const NETWORK_MESSAGE =
  "We could not reach the clinic service. Check your connection and try again.";
const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

type ErrorPayload = {
  message?: unknown;
  errors?: unknown;
  code?: unknown;
};

function firstFieldError(errors: unknown): string | null {
  if (!Array.isArray(errors)) return null;

  for (const entry of errors) {
    if (typeof entry === "string" && entry.trim()) return entry;
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const message = record.message ?? record.msg;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return null;
}

/**
 * Returns a message that is safe to show a patient or staff member.
 * Server messages are preferred because the API already sanitizes them.
 */
export function getApiError(
  error: unknown,
  fallback: string = FALLBACK_MESSAGE,
): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK" || !error.response) {
      return NETWORK_MESSAGE;
    }

    const payload = error.response.data as ErrorPayload | undefined;
    const message = payload?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const fieldError = firstFieldError(payload?.errors);
    if (fieldError) return fieldError;

    if (error.response.status === 409) {
      return "That time is no longer available. Please choose another slot.";
    }

    if (error.response.status === 403) {
      return "You do not have permission to do that.";
    }

    return fallback;
  }

  return fallback;
}

export function isConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}
