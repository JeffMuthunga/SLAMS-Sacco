# Phase 2: Authentication Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the login page end-to-end — inline 422 field errors, immediate session cache update on login/logout, and removal of the public self-registration route.

**Architecture:** `signIn.email` currently swallows AxiosErrors and returns `{data, error}` tuples, which prevents `extractFieldErrors` from inspecting the response. Task 1 removes those try-catch blocks so AxiosErrors propagate to callers. Tasks 2–6 update callers and UI. No new dependencies.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, React Query v5, axios, Sanctum SPA cookie auth, sonner toasts.

---

## File Map

- Modify: `frontend/src/lib/auth/auth-client.ts`
- Modify: `frontend/src/components/Auth/SigninWithPassword.tsx`
- Modify: `frontend/src/components/Auth/SignupWithPassword.tsx`
- Modify: `frontend/src/components/Auth/Signin/index.tsx`
- Modify: `frontend/src/app/(auth)/register/page.tsx`
- Modify: `frontend/src/components/Layouts/header/user-info/index.tsx`

---

## Task 1: Simplify auth-client — let AxiosErrors propagate

**Files:**
- Modify: `frontend/src/lib/auth/auth-client.ts`

The `signIn.email` and `signUp.email` functions currently catch AxiosErrors and convert them to `{data: null, error: {message: string}}`. This loses 422 field-error details before callers can inspect them. Remove the try-catch and change the return type to `Promise<Session>` — callers handle errors themselves.

- [ ] **Step 1: Replace `auth-client.ts` with the updated version**

Write `frontend/src/lib/auth/auth-client.ts` with this exact content:

```ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ensureCsrfCookie } from "../api";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  org_id?: string | null;
  role?: "admin" | "member";
  image?: string | null;
  bio?: string | null;
  phoneNumber?: string | number | null;
  [key: string]: unknown;
}

export interface Session {
  user: SessionUser;
}

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
  }): Promise<Session> => {
    await ensureCsrfCookie();
    const { data } = await api.post("/auth/login", {
      email: payload.email,
      password: payload.password,
      remember: payload.rememberMe ?? false,
    });
    return { user: data.data as SessionUser };
  },
};

export const signUp = {
  email: async (payload: {
    name: string;
    email: string;
    password: string;
    [key: string]: unknown;
  }): Promise<Session> => {
    await ensureCsrfCookie();
    const { data } = await api.post("/auth/register", payload);
    return { user: data.data as SessionUser };
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
  updateUser: async (payload: Record<string, unknown>) => {
    const { data } = await api.put("/auth/profile", payload);
    return data;
  },
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npx tsc --noEmit 2>&1 | head -20`

Expected: errors only in `SigninWithPassword.tsx` and `SignupWithPassword.tsx` (they still check `result.data` which no longer exists) — those are fixed in Tasks 2 and 3.

- [ ] **Step 3: Commit**

```bash
cd "/Users/wainaina/Development/Sacco/SLAMS Sacco"
git add frontend/src/lib/auth/auth-client.ts
git commit -m "refactor(auth): signIn/signUp throw AxiosErrors instead of returning result tuples"
```

---

## Task 2: Update `SigninWithPassword` — inline errors, session invalidation, remove Forgot Password

**Files:**
- Modify: `frontend/src/components/Auth/SigninWithPassword.tsx`

Replace the full file with the version below. Key changes from current:
- `signIn.email` now returns `Promise<Session>` (throws on error) — remove the `if (!result.data)` check
- Add `fieldErrors` state; use `extractFieldErrors` for 422s and `extractApiError` for everything else
- Call `useInvalidateSession()` after successful login so `useSession` (React Query) refreshes immediately
- Remove the "Forgot Password?" `<Link>` — password reset is deferred (see CLAUDE.md backlog)

- [ ] **Step 1: Write the updated component**

Write `frontend/src/components/Auth/SigninWithPassword.tsx` with this exact content:

```tsx
"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { signIn, useInvalidateSession } from "@/lib/auth/auth-client";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";

export default function SigninWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invalidateSession = useInvalidateSession();

  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    try {
      const callbackURL = searchParams.get("callbackUrl") || "/";

      await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.remember,
      });

      await invalidateSession();
      router.push(callbackURL);
      router.refresh();
      toast.success("Sign in successful");
    } catch (error) {
      const fe = extractFieldErrors(error);
      if (fe) {
        setFieldErrors(fe);
      } else {
        toast.error(extractApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const err = (field: string) => fieldErrors[field]?.[0];

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <InputGroup
          type="email"
          label="Email"
          className="[&_input]:py-3.75"
          placeholder="Enter your email"
          name="email"
          handleChange={handleChange}
          value={data.email}
          icon={<EmailIcon />}
        />
        {err("email") && (
          <p className="mt-1 text-sm text-red-500">{err("email")}</p>
        )}
      </div>

      <div className="mb-5">
        <InputGroup
          type="password"
          label="Password"
          className="[&_input]:py-3.75"
          placeholder="Enter your password"
          name="password"
          handleChange={handleChange}
          value={data.password}
          icon={<PasswordIcon />}
        />
        {err("password") && (
          <p className="mt-1 text-sm text-red-500">{err("password")}</p>
        )}
      </div>

      <div className="mb-6 flex items-center py-2 font-medium">
        <Checkbox
          label="Remember me"
          name="remember"
          withIcon="check"
          minimal
          radius="md"
          onChange={(e) => setData({ ...data, remember: e.target.checked })}
        />
      </div>

      <div className="mb-4.5">
        <button
          type="submit"
          disabled={loading}
          className="hover:bg-opacity-90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          Sign In
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npx tsc --noEmit 2>&1 | head -20`

Expected: `SignupWithPassword.tsx` still has errors (fixed in Task 3). No errors in `SigninWithPassword.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/wainaina/Development/Sacco/SLAMS Sacco"
git add frontend/src/components/Auth/SigninWithPassword.tsx
git commit -m "feat(auth): inline field errors + session invalidation on login, remove Forgot Password link"
```

---

## Task 3: Update `SignupWithPassword` for new interface

**Files:**
- Modify: `frontend/src/components/Auth/SignupWithPassword.tsx`

This component is unreachable (register page will redirect in Task 5), but TypeScript still type-checks it. The current `const result = await signUp.email(...)` then `if (!result.data)` pattern breaks because `signUp.email` now returns `Promise<Session>` (no `.data` property). Update to the throwing pattern for consistency.

- [ ] **Step 1: Write the updated component**

Write `frontend/src/components/Auth/SignupWithPassword.tsx` with this exact content:

```tsx
"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { signUp } from "@/lib/auth/auth-client";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import InputGroup from "../FormElements/InputGroup";

export default function SignupWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    try {
      const callbackURL = searchParams.get("callbackUrl") || "/";
      await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      router.push(callbackURL);
      router.refresh();
      toast.success("Account created successfully");
    } catch (error) {
      const fe = extractFieldErrors(error);
      if (fe) {
        setFieldErrors(fe);
      } else {
        toast.error(extractApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const err = (field: string) => fieldErrors[field]?.[0];

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <InputGroup
          type="text"
          label="Name"
          className="[&_input]:py-3.75"
          placeholder="Enter your name"
          name="name"
          handleChange={handleChange}
          value={data.name}
        />
        {err("name") && (
          <p className="mt-1 text-sm text-red-500">{err("name")}</p>
        )}
      </div>

      <div className="mb-4">
        <InputGroup
          type="email"
          label="Email"
          className="[&_input]:py-3.75"
          placeholder="Enter your email"
          name="email"
          handleChange={handleChange}
          value={data.email}
          icon={<EmailIcon />}
        />
        {err("email") && (
          <p className="mt-1 text-sm text-red-500">{err("email")}</p>
        )}
      </div>

      <div className="mb-5">
        <InputGroup
          type="password"
          label="Password"
          className="[&_input]:py-3.75"
          placeholder="Create a password"
          name="password"
          handleChange={handleChange}
          value={data.password}
          icon={<PasswordIcon />}
        />
        {err("password") && (
          <p className="mt-1 text-sm text-red-500">{err("password")}</p>
        )}
      </div>

      <div className="mb-4.5">
        <button
          type="submit"
          disabled={loading}
          className="hover:bg-opacity-90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          Sign Up
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript — zero errors**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/wainaina/Development/Sacco/SLAMS Sacco"
git add frontend/src/components/Auth/SignupWithPassword.tsx
git commit -m "refactor(auth): update SignupWithPassword for throwing signUp interface"
```

---

## Task 4: Remove Sign Up link + redirect register page

**Files:**
- Modify: `frontend/src/components/Auth/Signin/index.tsx`
- Modify: `frontend/src/app/(auth)/register/page.tsx`

Two small changes bundled in one commit since they're logically coupled (removing the registration flow).

- [ ] **Step 1: Update `Signin/index.tsx` — remove Sign Up link**

Write `frontend/src/components/Auth/Signin/index.tsx` with this exact content:

```tsx
import { Suspense } from "react";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigninWithPassword />
    </Suspense>
  );
}
```

- [ ] **Step 2: Update `register/page.tsx` — redirect to login**

Write `frontend/src/app/(auth)/register/page.tsx` with this exact content:

```tsx
import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/login");
}
```

- [ ] **Step 3: Verify TypeScript — zero errors**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/wainaina/Development/Sacco/SLAMS Sacco"
git add "frontend/src/components/Auth/Signin/index.tsx" "frontend/src/app/(auth)/register/page.tsx"
git commit -m "feat(auth): remove public registration — redirect /register to /login, drop Sign Up link"
```

---

## Task 5: Session invalidation on logout

**Files:**
- Modify: `frontend/src/components/Layouts/header/user-info/index.tsx`

After `signOut()` succeeds, call `useInvalidateSession()` before redirecting. Without this, `useSession` retains the old user for up to 5 minutes after logout (React Query stale time), causing the header to briefly show the previous user's name if they log back in quickly.

- [ ] **Step 1: Add `useInvalidateSession` to the import**

In `frontend/src/components/Layouts/header/user-info/index.tsx`, change:

```ts
import { signOut, useSession } from "@/lib/auth/auth-client";
```

to:

```ts
import { signOut, useSession, useInvalidateSession } from "@/lib/auth/auth-client";
```

- [ ] **Step 2: Wire `invalidateSession` into `handleLogout`**

In the same file, after the `const session = useSession();` line add:

```ts
const invalidateSession = useInvalidateSession();
```

Then update `handleLogout` to call it after `signOut()`:

```ts
async function handleLogout() {
  setIsOpen(false);
  const loadingId = toast.loading("Logging out...");

  try {
    await signOut();
    await invalidateSession();
    router.push("/login");
    toast.success("Logged out successfully");
  } catch {
    toast.error("Failed to log out");
  } finally {
    toast.dismiss(loadingId);
  }
}
```

- [ ] **Step 3: Verify TypeScript — zero errors**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/wainaina/Development/Sacco/SLAMS Sacco"
git add "frontend/src/components/Layouts/header/user-info/index.tsx"
git commit -m "feat(auth): invalidate React Query session cache on logout"
```

---

## Task 6: Final verification

- [ ] **Step 1: Full TypeScript check**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npx tsc --noEmit`

Expected: No output (zero errors).

- [ ] **Step 2: Production build**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npm run build 2>&1 | tail -20`

Expected: Build succeeds, 22+ routes generated, exit code 0.

- [ ] **Step 3: Backend tests still pass**

Run: `cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/backend" && php artisan test`

Expected: All tests pass (no backend changes were made, so this is a sanity check).

- [ ] **Step 4: Browser smoke test**

Start servers:
```bash
# Terminal 1
cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/backend" && php artisan serve

# Terminal 2
cd "/Users/wainaina/Development/Sacco/SLAMS Sacco/frontend" && npm run dev
```

Test these flows:

1. Visit `http://localhost:3000` → should redirect to `/login`
2. Submit empty form → should see inline errors on email and password fields
3. Submit wrong credentials → should see inline error under email: "These credentials do not match our records."
4. Submit correct credentials (use seeded admin: `admin@slams.test` / `password`) → should redirect to `/admin/dashboard`
5. Header should show admin's name immediately (no blank flash)
6. Click "Log out" → should redirect to `/login`; revisit `/admin/dashboard` → should redirect back to `/login`
7. Visit `http://localhost:3000/register` → should redirect to `/login`
