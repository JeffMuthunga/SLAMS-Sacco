"use client";

import React, { useState } from "react";
import { useChartOfAccounts, useLedger } from "@/lib/api/journals";
import { extractApiError } from "@/lib/api";

function fmt(v: string) {
  const n = parseFloat(v);
  const abs = Math.abs(n).toLocaleString("en-BW", { minimumFractionDigits: 2 });
  return n < 0 ? `(${abs})` : abs;
}

export default function LedgerPage() {
  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate]   = useState("");
  const [toDate, setToDate]       = useState("");
  const [queried, setQueried]     = useState<{ account_id: string; from_date?: string; to_date?: string } | null>(null);

  const { data: accounts = [] } = useChartOfAccounts({ active_only: true });
  const { data: ledger, isLoading, error } = useLedger(queried ?? { account_id: "" });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setQueried({
      account_id: accountId,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    });
  };

  const totalDebit  = ledger?.lines.reduce((s, l) => s + parseFloat(l.debit),  0) ?? 0;
  const totalCredit = ledger?.lines.reduce((s, l) => s + parseFloat(l.credit), 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Transactions Ledger</h1>

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— select account —</option>
            {accounts
              .filter((a) => !a.is_header)
              .map((a) => (
                <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!accountId}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
        >
          View Ledger
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {!queried && !isLoading && (
        <p className="text-sm text-gray-400">Select an account above and click View Ledger to see its transaction history.</p>
      )}

      {ledger && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-dark dark:text-white">
              {ledger.account.code} – {ledger.account.name}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Narration</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Debit</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Credit</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.lines.map((l) => (
                  <tr key={l.journal_line_id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(l.journal_date).toLocaleDateString("en-BW")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{l.reference_number}</td>
                    <td className="px-4 py-3 text-gray-600">{l.narration ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {parseFloat(l.debit) > 0 ? fmt(l.debit) : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {parseFloat(l.credit) > 0 ? fmt(l.credit) : ""}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${parseFloat(l.running_balance) < 0 ? "text-red-600" : ""}`}>
                      {fmt(l.running_balance)}
                    </td>
                  </tr>
                ))}
                {ledger.lines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No posted entries found for this account in the selected range.
                    </td>
                  </tr>
                )}
              </tbody>
              {ledger.lines.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-semibold bg-gray-50 dark:bg-gray-800">
                    <td colSpan={3} className="px-4 pt-3 pb-3 text-gray-600">Totals</td>
                    <td className="px-4 pt-3 pb-3 text-right font-mono">{fmt(totalDebit.toString())}</td>
                    <td className="px-4 pt-3 pb-3 text-right font-mono">{fmt(totalCredit.toString())}</td>
                    <td className="px-4 pt-3 pb-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
