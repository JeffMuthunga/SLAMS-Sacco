"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePettyCashAllocation } from "@/lib/api/petty-cash";
import { useFiscalYears, usePeriods } from "@/lib/api/configurations";
import { useMembers } from "@/lib/api/members";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";

export default function CreateAllocationPage() {
  const router = useRouter();

  const [fyId, setFyId]         = useState("");
  const [periodId, setPeriodId] = useState("");
  const [userId, setUserId]     = useState("");
  const [amount, setAmount]     = useState("");
  const [narration, setNarration] = useState("");
  const [errors, setErrors]     = useState<Record<string, string[]> | null>(null);

  const { data: fiscalYears = [] } = useFiscalYears();
  const { data: periods = [] }     = usePeriods(fyId);
  const { data: membersData }      = useMembers({ per_page: 200 });
  const members = membersData?.data ?? [];

  const createMutation = useCreatePettyCashAllocation();

  const err = (k: string) => errors?.[k]?.[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    createMutation.mutate(
      { period_id: periodId, allocated_to: userId, amount, narration: narration || undefined },
      {
        onSuccess: (a) => {
          toast.success("Allocation created.");
          router.push(`/admin/petty-cash/${a.id}`);
        },
        onError: (err) => {
          const fe = extractFieldErrors(err);
          if (fe) { setErrors(fe); } else { toast.error(extractApiError(err)); }
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">New Petty Cash Allocation</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Fiscal Year</label>
              <select
                value={fyId}
                onChange={(e) => { setFyId(e.target.value); setPeriodId(""); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>{fy.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Period</label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                disabled={!fyId}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">— select —</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {err("period_id") && <p className="mt-0.5 text-xs text-red-500">{err("period_id")}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Allocate To (Member / User)</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">— select member —</option>
              {members.filter((m) => m.user_id).map((m) => (
                <option key={m.id} value={m.user_id!}>
                  {m.full_name} ({m.member_number})
                </option>
              ))}
            </select>
            {err("allocated_to") && <p className="mt-0.5 text-xs text-red-500">{err("allocated_to")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            {err("amount") && <p className="mt-0.5 text-xs text-red-500">{err("amount")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Narration (optional)</label>
            <textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              rows={2}
              placeholder="Purpose of allocation…"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create Allocation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
