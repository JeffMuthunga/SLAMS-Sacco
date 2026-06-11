import axios, { AxiosError } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ApiMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
  meta?: ApiMeta;
}

/**
 * Axios client for the Laravel API (/api/v1). Uses Sanctum SPA cookie auth:
 * withCredentials sends the session cookie, and axios automatically mirrors
 * the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
 */
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

/** Sanctum requires the CSRF cookie before login/register requests. */
export async function ensureCsrfCookie(): Promise<void> {
  await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}

/** Extract a human-readable message from an API error response. */
export function extractApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const envelope = error.response?.data as ApiEnvelope<unknown> | undefined;
    if (envelope?.errors) {
      const first = Object.values(envelope.errors)[0];
      if (first?.length) return first[0];
    }
    if (envelope?.message) return envelope.message;
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

/** Field-level validation errors (422) keyed by input name, for inline display. */
export function extractFieldErrors(
  error: unknown,
): Record<string, string[]> | null {
  if (error instanceof AxiosError && error.response?.status === 422) {
    return (error.response.data as ApiEnvelope<unknown>).errors ?? null;
  }
  return null;
}
