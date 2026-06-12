# Phase 2: Authentication Polish Design

**Date:** 2026-06-12
**Status:** Approved

---

## Goal

Wire the login page end-to-end in the browser: inline field errors, immediate session cache update on login/logout, and removal of the public self-registration route.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Self-registration | Remove — SACCOs are closed membership systems; user creation is admin-managed |
| Password reset | Deferred to Phase 14 (requires email infrastructure); remove the dead link for now |
| Form library | None added — patch existing components in place (approach A) |
| Demo credential pre-fill | Keep — env-var gated, not present in production |

---

## Changes

### 1. `SigninWithPassword.tsx`

**Inline field errors**

Replace the current generic error handling with `extractFieldErrors` for 422 responses and `extractApiError` for everything else. Field errors are shown inline below the relevant input. Non-422 errors surface as a sonner toast.

```
email field    → fieldErrors["email"]?.[0]
password field → fieldErrors["password"]?.[0]
```

**Session cache invalidation after login**

Call `useInvalidateSession()` after `signIn.email` succeeds. This forces `useSession` (React Query) to re-fetch immediately so the header `UserInfo` shows the authenticated user without waiting for the 5-minute stale time.

**Remove "Forgot Password?" link**

Delete the link element. Password reset is deferred to Phase 14.

---

### 2. `Signin/index.tsx`

Remove the "Don't have any account? Sign Up" link that points to `/register`. The form renders without it.

---

### 3. `app/(auth)/register/page.tsx`

Replace page body with an immediate server-side redirect to `/login`:

```tsx
import { redirect } from "next/navigation";
export default function RegisterPage() {
  redirect("/login");
}
```

`SignupWithPassword.tsx` and `Signup/index.tsx` remain in the codebase (unreachable) to avoid breaking any lingering imports from the template.

---

### 4. `UserInfo.tsx`

Call `useInvalidateSession()` after `signOut()` succeeds, before `router.push("/login")`. This clears the React Query session cache immediately so no stale user data lingers after logout.

---

## Data Flow: Login

1. User visits any protected route → proxy detects no `slams_session` cookie → redirects to `/login?callbackUrl=<path>`
2. User submits login form → `ensureCsrfCookie()` → `POST /api/v1/auth/login`
3. **422 response** → `extractFieldErrors` → inline errors on email/password fields
4. **Other error** → `extractApiError` → sonner toast
5. **Success** → `useInvalidateSession()` → `router.push(callbackUrl || "/")` → root page does role-aware redirect (`admin` → `/admin/dashboard`, `member` → `/member/dashboard`)

## Data Flow: Logout

1. User clicks "Log out" in header dropdown → `signOut()` → `POST /api/v1/auth/logout`
2. **Success** → `useInvalidateSession()` → `router.push("/login")`
3. **Failure** → sonner toast "Failed to log out"

---

## Out of Scope for Phase 2

- Password reset / forgot-password flow (Phase 14)
- Admin-managed user creation (Phase 3 RBAC)
- Member self-registration with invite token (Phase 12)
- Profile update (`authClient.updateUser` — known follow-up)
