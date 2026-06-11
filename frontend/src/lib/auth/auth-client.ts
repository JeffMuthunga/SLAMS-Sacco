"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ensureCsrfCookie, extractApiError } from "../api";

/**
 * Laravel-backed auth client. Replaces the template's better-auth client while
 * keeping the same call surface so existing components keep working:
 * signIn.email, signUp.email, signOut, useSession, getSession, authClient.updateUser
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: "admin" | "member";
  bio?: string | null;
  phoneNumber?: string | number | null;
  [key: string]: unknown;
}

export interface Session {
  user: SessionUser;
}

type AuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string } };

export const SESSION_QUERY_KEY = ["auth", "session"] as const;

export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await api.get("/auth/me");
    return { user: data.data as SessionUser };
  } catch {
    return null;
  }
}

export const signIn = {
  email: async (payload: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<AuthResult<Session>> => {
    try {
      await ensureCsrfCookie();
      const { data } = await api.post("/auth/login", {
        email: payload.email,
        password: payload.password,
        remember: payload.rememberMe ?? false,
      });
      return { data: { user: data.data as SessionUser }, error: null };
    } catch (error) {
      return { data: null, error: { message: extractApiError(error) } };
    }
  },
};

export const signUp = {
  email: async (payload: {
    name: string;
    email: string;
    password: string;
    [key: string]: unknown;
  }): Promise<AuthResult<Session>> => {
    try {
      await ensureCsrfCookie();
      const { data } = await api.post("/auth/register", payload);
      return { data: { user: data.data as SessionUser }, error: null };
    } catch (error) {
      return { data: null, error: { message: extractApiError(error) } };
    }
  },
};

export async function signOut(): Promise<void> {
  await api.post("/auth/logout");
}

export function useSession(): {
  data: Session | null;
  isPending: boolean;
  refetch: () => void;
} {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
    staleTime: 5 * 60 * 1000,
  });
  return {
    data: query.data ?? null,
    isPending: query.isPending,
    refetch: query.refetch,
  };
}

/** Invalidate the cached session after login/logout/profile changes. */
export function useInvalidateSession(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}

export const authClient = {
  /** TODO(auth): point at the real profile endpoint once the Laravel backend exists. */
  updateUser: async (payload: Record<string, unknown>) => {
    const { data } = await api.put("/auth/profile", payload);
    return data;
  },
};
