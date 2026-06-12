"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import NumberInput from "@/components/Forms/NumberInput";
import DateInput from "@/components/Forms/DateInput";
import { useAccount, useUpdateAccount } from "@/lib/api/accounts";
import { extractApiError, extractFieldErrors } from "@/lib/api";

interface FormErrors {
  interest_rate?: string;
  locked_until_date?: string;
}

export default function EditAccountPage() {
  const params  = useParams<{ id: string }>();
  const id      = params.id;
  const router  = useRouter();

  const { data: account, isLoading } = useAccount(id);
  const updateAccount = useUpdateAccount(id);

  const [interestRate, setInterestRate]     = useState("");
  const [isLocked, setIsLocked]             = useState(false);
  const [lockedUntil, setLockedUntil]       = useState("");
  const [errors, setErrors]                 = useState<FormErrors>({});

  useEffect(() => {
    if (account) {
      setInterestRate(account.interest_rate ?? "");
      setIsLocked(account.is_locked);
      setLockedUntil(account.locked_until_date ?? "");
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await updateAccount.mutateAsync({
        interest_rate: interestRate || undefined,
        is_locked: isLocked,
        locked_until_date: isLocked ? (lockedUntil || null) : null,
      });
      toast.success("Account updated.");
      router.push(`/admin/accounts/${id}`);
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors as FormErrors);
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!account)  return <p className="text-sm text-red-500">Account not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">
        Edit Account — {account.account_number}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col gap-5"
      >
        <NumberInput
          label="Interest Rate (% p.a.)"
          id="interestRate"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="0.00"
          min={0}
          max={100}
          step="any"
          error={errors.interest_rate}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isLocked"
            checked={isLocked}
            onChange={(e) => {
              setIsLocked(e.target.checked);
              if (!e.target.checked) setLockedUntil("");
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isLocked" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Lock account (prevent withdrawals)
          </label>
        </div>

        {isLocked && (
          <DateInput
            label="Locked Until"
            id="lockedUntil"
            value={lockedUntil}
            onChange={(d) => setLockedUntil(d)}
            minDate="today"
            error={errors.locked_until_date}
          />
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updateAccount.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {updateAccount.isPending ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
