"use client";

import React, { useState } from "react";
import ContributionsTable from "@/components/Contributions/ContributionsTable";
import { useGenerateContributions } from "@/lib/api/contributions";
import { useFiscalYears, usePeriods } from "@/lib/api/configurations";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";

function GenerateModal({ onClose }: { onClose: () => void }) {
  const [fyId, setFyId]             = useState("");
  const [periodId, setPeriodId]     = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");

  const { data: fiscalYears = [] } = useFiscalYears();
  const { data: periods = [] }     = usePeriods(fyId);
  const generateMutation = useGenerateContributions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodId) { toast.error("Please select a period."); return; }
    generateMutation.mutate(
      { period_id: periodId, expected_amount: expectedAmount || undefined },
      {
        onSuccess: (res) => {
          toast.success(`${res.generated} contribution record(s) generated.`);
          onClose();
        },
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Generate Contributions
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
              Fiscal Year
            </label>
            <select
              value={fyId}
              onChange={(e) => { setFyId(e.target.value); setPeriodId(""); }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            >
              <option value="">— select fiscal year —</option>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>{fy.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
              Period
            </label>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              disabled={!fyId || periods.length === 0}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 disabled:opacity-50"
            >
              <option value="">— select period —</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
              Expected Amount <span className="font-normal text-gray-500">(optional — uses SACCO setting default)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 2000.00"
              value={expectedAmount}
              onChange={(e) => setExpectedAmount(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generateMutation.isPending || !periodId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {generateMutation.isPending ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContributionsPage() {
  const [showGenerate, setShowGenerate] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Contributions</h1>
        <button
          onClick={() => setShowGenerate(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Generate Contributions
        </button>
      </div>

      <ContributionsTable />
    </div>
  );
}
