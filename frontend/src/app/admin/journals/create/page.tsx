"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  StoreLedgerLinePayload,
  useChartOfAccounts,
  useCreateJournal,
} from "@/lib/api/journals";
import { useFiscalYears, usePeriods } from "@/lib/api/configurations";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";

type LineState = {
  account_id: string;
  debit: string;
  credit: string;
  narration: string;
};

const EMPTY_LINE: LineState = { account_id: "", debit: "0", credit: "0", narration: "" };

function fmt(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? "0.00" : n.toFixed(2);
}

export default function CreateJournalPage() {
  const router = useRouter();

  const [fyId, setFyId]         = useState("");
  const [periodId, setPeriodId] = useState("");
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");
  const [lines, setLines]       = useState<LineState[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [errors, setErrors]     = useState<Record<string, string[]> | null>(null);

  const { data: fiscalYears = [] } = useFiscalYears();
  const { data: periods = [] }     = usePeriods(fyId);
  const { data: accounts = [] }    = useChartOfAccounts({ active_only: true });
  const createMutation             = useCreateJournal();

  const setLine = (i: number, k: keyof LineState, v: string) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  const addLine    = () => setLines((ls) => [...ls, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const err = (k: string) => errors?.[k]?.[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (!fyId)     { toast.error("Select a fiscal year."); return; }
    if (!periodId) { toast.error("Select a period."); return; }
    if (!balanced) { toast.error("Journal is not balanced."); return; }

    const payload = {
      fiscal_year_id: fyId,
      period_id: periodId,
      journal_date: date,
      narration: narration || undefined,
      lines: lines.map((l): StoreLedgerLinePayload => ({
        account_id: l.account_id,
        debit:      parseFloat(l.debit) || 0,
        credit:     parseFloat(l.credit) || 0,
        narration:  l.narration || undefined,
      })),
    };

    createMutation.mutate(payload, {
      onSuccess: (j) => {
        toast.success("Journal entry created.");
        router.push(`/admin/journals/${j.id}`);
      },
      onError: (err) => {
        const fe = extractFieldErrors(err);
        if (fe) { setErrors(fe); } else { toast.error(extractApiError(err)); }
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">New Journal Entry</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Entry Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              {err("fiscal_year_id") && <p className="mt-0.5 text-xs text-red-500">{err("fiscal_year_id")}</p>}
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
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Narration (optional)</label>
              <input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Brief description"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Lines */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Journal Lines</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left font-medium text-gray-500">Account</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Debit</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Credit</th>
                  <th className="pb-2 text-left font-medium text-gray-500 pl-3">Narration</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-2">
                      <select
                        value={line.account_id}
                        onChange={(e) => setLine(i, "account_id", e.target.value)}
                        className="w-56 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                      >
                        <option value="">— account —</option>
                        {accounts
                          .filter((a) => !a.is_header)
                          .map((a) => (
                            <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                          ))}
                      </select>
                      {err(`lines.${i}.account_id`) && (
                        <p className="text-xs text-red-500">{err(`lines.${i}.account_id`)}</p>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit}
                        onChange={(e) => setLine(i, "debit", e.target.value)}
                        className="w-28 rounded border border-gray-300 bg-white px-2 py-1 text-right text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit}
                        onChange={(e) => setLine(i, "credit", e.target.value)}
                        className="w-28 rounded border border-gray-300 bg-white px-2 py-1 text-right text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 pl-3 pr-2">
                      <input
                        value={line.narration}
                        onChange={(e) => setLine(i, "narration", e.target.value)}
                        placeholder="optional"
                        className="w-40 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-2 text-center">
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove line"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td className="pt-2 text-gray-600">Totals</td>
                  <td className={`pt-2 text-right font-mono ${!balanced ? "text-red-600" : "text-green-700"}`}>
                    {fmt(totalDebit.toString())}
                  </td>
                  <td className={`pt-2 text-right font-mono ${!balanced ? "text-red-600" : "text-green-700"}`}>
                    {fmt(totalCredit.toString())}
                  </td>
                  <td colSpan={2} className="pt-2 pl-3 text-xs">
                    {balanced ? (
                      <span className="text-green-600">✓ Balanced</span>
                    ) : (
                      <span className="text-red-600">✗ Not balanced</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 text-sm text-primary hover:underline"
          >
            + Add line
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !balanced}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving…" : "Create Journal Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
