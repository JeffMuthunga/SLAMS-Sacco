"use client";

import React, { useState } from "react";
import { useMemberAccounts, useMemberAccountStatement } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";
import type { DepositAccount } from "@/lib/api/accounts";

function AccountCard({
  account,
  selected,
  onClick,
}: {
  account: DepositAccount;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-gray-200 bg-white hover:border-primary/50 dark:border-gray-700 dark:bg-gray-dark"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-sm text-gray-500">{account.account_number}</p>
          <p className="mt-0.5 text-sm font-medium text-dark dark:text-white">
            {(account.product as { name?: string } | null)?.name ?? "Savings Account"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Balance</p>
          <p className="font-bold text-dark dark:text-white">
            BWP {Number(account.balance).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      {account.interest_rate && (
        <p className="mt-1 text-xs text-gray-400">Rate: {account.interest_rate}%</p>
      )}
    </button>
  );
}

function StatementTable({ accountId }: { accountId: string }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [applied, setApplied]   = useState<{ from_date?: string; to_date?: string }>({});

  const { data, isLoading, error } = useMemberAccountStatement(accountId, applied);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button
          onClick={() => setApplied({ from_date: fromDate || undefined, to_date: toDate || undefined })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Apply
        </button>
        {(applied.from_date || applied.to_date) && (
          <button onClick={() => { setFromDate(""); setToDate(""); setApplied({}); }}
            className="text-sm text-gray-500 hover:text-red-500">Clear</button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading transactions…</p>
      ) : !data?.data.length ? (
        <p className="text-sm text-gray-400 italic">No transactions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 text-left text-xs text-gray-500">Date</th>
                <th className="pb-2 text-left text-xs text-gray-500">Type</th>
                <th className="pb-2 text-left text-xs text-gray-500">Narration</th>
                <th className="pb-2 text-right text-xs text-gray-500">Amount</th>
                <th className="pb-2 text-right text-xs text-gray-500">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((tx) => {
                const isCredit = ["deposit", "interest_credit", "transfer_in", "loan_disbursement", "contribution"].includes(tx.transaction_type);
                return (
                  <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="py-2">{new Date(tx.transaction_date).toLocaleDateString("en-BW")}</td>
                    <td className="py-2 capitalize text-gray-600 dark:text-gray-400">
                      {tx.transaction_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{tx.narration ?? "—"}</td>
                    <td className={`py-2 text-right font-medium ${isCredit ? "text-green-600" : "text-red-500"}`}>
                      {isCredit ? "+" : "-"}BWP {Number(tx.amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 text-right font-medium">
                      BWP {Number(tx.balance_after).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MemberAccountsPage() {
  const { data: accounts, isLoading, error } = useMemberAccounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;

  const selected = accounts?.find((a) => a.id === selectedId) ?? accounts?.[0] ?? null;
  const effectiveId = selectedId ?? selected?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">My Accounts</h1>

      {!accounts?.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400">No accounts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Account list */}
          <div className="flex flex-col gap-3">
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                selected={effectiveId === acc.id}
                onClick={() => setSelectedId(acc.id)}
              />
            ))}
          </div>

          {/* Statement */}
          <div className="lg:col-span-2">
            {effectiveId ? (
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
                <h2 className="mb-4 font-semibold text-dark dark:text-white">
                  Account Statement — {selected?.account_number}
                </h2>
                <StatementTable accountId={effectiveId} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
