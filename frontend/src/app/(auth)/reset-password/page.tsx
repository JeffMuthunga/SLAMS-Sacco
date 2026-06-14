"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api, extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      setDone(true);
      toast.success("Password reset successfully.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (fe) setErrors(fe);
      else toast.error(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const e = (f: string) => errors[f]?.[0];

  if (!token || !email) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
        <p className="text-sm text-red-700 dark:text-red-300">
          Invalid reset link. Please request a new one.
        </p>
        <Link href="/forgot-password" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          Request new link
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
      <p className="text-sm font-medium text-green-700 dark:text-green-300">
        Password reset successfully. Redirecting to login…
      </p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-dark space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          New Password
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(ev) => setForm((p) => ({ ...p, password: ev.target.value }))}
          required
          autoComplete="new-password"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {e("password") && <p className="mt-1 text-xs text-red-500">{e("password")}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm New Password
        </label>
        <input
          type="password"
          value={form.password_confirmation}
          onChange={(ev) => setForm((p) => ({ ...p, password_confirmation: ev.target.value }))}
          required
          autoComplete="new-password"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {e("password_confirmation") && <p className="mt-1 text-xs text-red-500">{e("password_confirmation")}</p>}
        {e("token") && <p className="mt-1 text-xs text-red-500">{e("token")}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
      >
        {loading ? (
          <>
            Resetting…
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </>
        ) : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-dark px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-500">Enter your new password below.</p>
        </div>

        <Suspense fallback={<p className="text-center text-sm text-gray-500">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
