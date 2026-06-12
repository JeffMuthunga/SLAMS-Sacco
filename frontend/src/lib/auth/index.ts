import { API_BASE_URL } from "../api";
import type { SessionUser } from "./auth-client";

/**
 * Server-side session lookup for React Server Components. Forwards the
 * incoming request cookies to the Laravel API. Mirrors the template's
 * better-auth `auth.api.getSession({ headers })` surface.
 */
export const auth = {
  api: {
    async getSession({
      headers,
    }: {
      headers: Headers;
    }): Promise<{ user: SessionUser } | null> {
      const cookie = headers.get("cookie");
      if (!cookie) return null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            cookie,
            Accept: "application/json",
            // Sanctum only authenticates session cookies on requests that
            // identify as coming from a stateful (frontend) origin.
            Referer:
              process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          },
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = await res.json();
        return { user: json.data as SessionUser };
      } catch {
        return null;
      }
    },
  },
};
