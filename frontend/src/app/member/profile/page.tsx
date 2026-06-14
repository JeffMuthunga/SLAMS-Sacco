"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { api, extractApiError, extractFieldErrors } from "@/lib/api";
import { useSession, useInvalidateSession } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export default function MemberProfilePage() {
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();

  const [profile, setProfile] = useState<ProfileForm>({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [profileLoading, setProfileLoading] = useState(false);

  const [pw, setPw] = useState<PasswordForm>({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string[]>>({});
  const [pwLoading, setPwLoading] = useState(false);

  React.useEffect(() => {
    if (session?.user) {
      setProfile({ name: session.user.name, email: session.user.email });
    }
  }, [session?.user?.name, session?.user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileErrors({});
    setProfileLoading(true);
    try {
      await api.put("/auth/profile", { name: profile.name, email: profile.email });
      await invalidateSession();
      toast.success("Profile updated.");
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (fe) setProfileErrors(fe);
      else toast.error(extractApiError(err));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwErrors({});
    if (pw.password !== pw.password_confirmation) {
      setPwErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }
    setPwLoading(true);
    try {
      await api.put("/auth/profile", {
        current_password: pw.current_password,
        password: pw.password,
        password_confirmation: pw.password_confirmation,
      });
      toast.success("Password changed.");
      setPw({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (fe) setPwErrors(fe);
      else toast.error(extractApiError(err));
    } finally {
      setPwLoading(false);
    }
  }

  const pe = (f: string) => profileErrors[f]?.[0];
  const we = (f: string) => pwErrors[f]?.[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Profile Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Update your account name, email, and password.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
        <h2 className="mb-4 font-semibold text-dark dark:text-white">Account Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {pe("name") && <p className="mt-1 text-xs text-red-500">{pe("name")}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {pe("email") && <p className="mt-1 text-xs text-red-500">{pe("email")}</p>}
          </div>
          <Button type="submit" disabled={profileLoading}>
            {profileLoading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </div>

      <div id="password" className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
        <h2 className="mb-4 font-semibold text-dark dark:text-white">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              autoComplete="current-password"
            />
            {we("current_password") && <p className="mt-1 text-xs text-red-500">{we("current_password")}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={pw.password}
              onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              autoComplete="new-password"
            />
            {we("password") && <p className="mt-1 text-xs text-red-500">{we("password")}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={pw.password_confirmation}
              onChange={(e) => setPw((p) => ({ ...p, password_confirmation: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              autoComplete="new-password"
            />
            {we("password_confirmation") && <p className="mt-1 text-xs text-red-500">{we("password_confirmation")}</p>}
          </div>
          <Button type="submit" disabled={pwLoading}>
            {pwLoading ? "Updating…" : "Change Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
