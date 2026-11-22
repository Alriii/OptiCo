import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = "/api/v1";
const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

// Auth endpoints must never trigger the refresh-and-retry loop.
const NO_REFRESH_PATHS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/signup",
  "/auth/csrf-token",
  "/auth/accept-invite",
];

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let csrfToken: string | null = null;
let csrfRequest: Promise<string | null> | null = null;

function readCsrfToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const nested =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;

  const value = body.csrfToken ?? nested?.csrfToken;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Fetches a CSRF token once and reuses it. Pass force=true after a session
 * change, because the backend rotates the token with the refresh cookie.
 */
export async function fetchCsrfToken(force = false): Promise<string | null> {
  if (!force && csrfToken) return csrfToken;
  if (csrfRequest) return csrfRequest;

  csrfRequest = api
    .get("/auth/csrf-token")
    .then((response) => {
      csrfToken = readCsrfToken(response.data);
      return csrfToken;
    })
    .catch(() => null)
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

export async function refreshCsrfToken(): Promise<string | null> {
  return fetchCsrfToken(true);
}

export function clearCsrfToken() {
  csrfToken = null;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (!MUTATION_METHODS.has(method)) return config;

  const token = await fetchCsrfToken();
  if (token) {
    config.headers.set("x-csrf-token", token);
  }
  return config;
});

let refreshRequest: Promise<void> | null = null;

// Single-flight refresh. Uses a bare axios call so the interceptor cannot
// recurse into itself when the refresh endpoint returns 401.
function refreshSession(): Promise<void> {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    const token = await fetchCsrfToken(true);
    await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: token ? { "x-csrf-token": token } : undefined,
      },
    );
    await fetchCsrfToken(true);
  })().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? "";
    const isAuthPath = NO_REFRESH_PATHS.some((path) => url.includes(path));

    if (status === 401 && config && !config._retry && !isAuthPath) {
      config._retry = true;
      try {
        await refreshSession();
        return api(config);
      } catch (refreshError) {
        // Let the app decide how to react; the proxy only does optimistic checks.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("optico:unauthorized"));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
