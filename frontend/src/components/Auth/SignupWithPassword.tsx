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
