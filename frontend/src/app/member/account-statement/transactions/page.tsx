"use client";

import React, { useState } from "react";
import { useMemberTransactions } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";

const TX_TYPES = [
  { value: "",                  label: "All Types" },
  { value: "deposit",           label: "Deposit" },
  { value: "withdrawal",        label: "Withdrawal" },
  { value: "interest_credit",   label: "Interest Credit" },
  { value: "fee",               label: "Fee" },
  { value: "transfer_in",       label: "Transfer In" },
  { value: "transfer_out",      label: "Transfer Out" },
  { value: "loan_disbursement", label: "Loan Disbursement" },
  { value: "loan_repayment",    label: "Loan Repayment" },
  { value: "contribution",      label: "Contribution" },
];

const CREDIT_TYPES = new Set(["deposit", "interest_credit", "transfer_in", "loan_disbursement", "contribution"]);

export default function MemberTransactionsPage() {
  const [fromDate, setFromDate]     = useState("");
  const [toDate, setToDate]         = useState("");
  const [txType, setTxType]         = useState("");
  const [applied, setApplied]       = useState<{
    from_date?: string; to_date?: string; transaction_type?: string;
  }>({});

  const { data, isLoading, error } = useMemberTransactions(applied);

  const handleApply = () =>
    setApplied({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      transaction_type: txType || undefined,
    });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Transaction History</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
        <div className="flex flex-wrap items-end gap-3 mb-4">
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
          <div>
            <label className="mb-1 block text-xs text-gray-500">Type</label>
            <select value={txType} onChange={(e) => setTxType(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
              {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button onClick={handleApply}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
            Apply
          </button>
          {(applied.from_date || applied.to_date || applied.transaction_type) && (
            <button onClick={() => { setFromDate(""); setToDate(""); setTxType(""); setApplied({}); }}
              className="text-sm text-gray-500 hover:text-red-500">Clear</button>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : !data?.data.length ? (
          <p className="text-sm text-gray-400 italic">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-xs text-gray-500">Date</th>
                  <th className="pb-2 text-left text-xs text-gray-500">Reference</th>
                  <th className="pb-2 text-left text-xs text-gray-500">Type</th>
                  <th className="pb-2 text-left text-xs text-gray-500">Narration</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Amount</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((tx) => {
                  const isCredit = CREDIT_TYPES.has(tx.transaction_type);
                  return (
                    <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-2 whitespace-nowrap">{new Date(tx.transaction_date).toLocaleDateString("en-BW")}</td>
                      <td className="py-2 font-mono text-xs text-gray-500">{tx.reference_number ?? "—"}</td>
                      <td className="py-2 capitalize text-gray-600 dark:text-gray-400">
                        {tx.transaction_type.replace(/_/g, " ")}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{tx.narration ?? "—"}</td>
                      <td className={`py-2 text-right font-medium ${isCredit ? "text-green-600" : "text-red-500"}`}>
                        {isCredit ? "+" : "-"}BWP {Number(tx.amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right">
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
    </div>
  );
}
