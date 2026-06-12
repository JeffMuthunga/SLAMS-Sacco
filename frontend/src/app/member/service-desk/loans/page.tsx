"use client";

import React, { useState } from "react";
import { useMemberLoans, useMemberLoan } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";
import type { Loan, LoanStatus } from "@/lib/api/loans";

const STATUS_CFG: Record<LoanStatus, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-gray-100 text-gray-600" },
  applied:   { label: "Applied",   className: "bg-blue-100 text-blue-700" },
  approved:  { label: "Approved",  className: "bg-yellow-100 text-yellow-700" },
  rejected:  { label: "Rejected",  className: "bg-red-100 text-red-700" },
  disbursed: { label: "Disbursed", className: "bg-green-100 text-green-700" },
  active:    { label: "Active",    className: "bg-green-100 text-green-700" },
  repaid:    { label: "Repaid",    className: "bg-gray-100 text-gray-600" },
  defaulted: { label: "Defaulted", className: "bg-red-100 text-red-700" },
};

function LoanCard({ loan, selected, onClick }: { loan: Loan; selected: boolean; onClick: () => void }) {
  const cfg = STATUS_CFG[loan.loan_status] ?? { label: loan.loan_status, className: "bg-gray-100 text-gray-600" };
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-primary/50 dark:border-gray-700 dark:bg-gray-dark"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm text-gray-500">{loan.account_number}</p>
          <p className="mt-0.5 text-sm font-medium text-dark dark:text-white">
            {(loan.loan_product as { name?: string } | null)?.name ?? "Loan"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-500">Principal</p>
          <p className="font-medium">KES {Number(loan.principal_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-gray-500">Outstanding</p>
          <p className="font-medium">KES {Number(loan.outstanding_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </button>
  );
}

function LoanDetail({ loanId }: { loanId: string }) {
  const { data: loan, isLoading, error } = useMemberLoan(loanId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error)     return <p className="text-sm text-red-500">{extractApiError(error)}</p>;
  if (!loan)     return null;

  const cfg = STATUS_CFG[loan.loan_status] ?? { label: loan.loan_status, className: "bg-gray-100 text-gray-600" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-gray-500">{loan.account_number}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          ["Principal", `KES ${Number(loan.principal_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Outstanding Balance", `KES ${Number(loan.outstanding_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Interest Rate", `${loan.interest_rate}% p.a.`],
          ["Repayment Period", `${loan.repayment_period} months`],
          ["Repayment Amount", `KES ${Number(loan.repayment_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Disbursed Date", loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString("en-KE") : "—"],
          ["Maturity Date", loan.maturity_date ? new Date(loan.maturity_date).toLocaleDateString("en-KE") : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-medium text-dark dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {loan.repayments && loan.repayments.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-dark dark:text-white">Repayment Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500">Due Date</th>
                  <th className="pb-2 text-right text-gray-500">Total Due</th>
                  <th className="pb-2 text-right text-gray-500">Total Paid</th>
                  <th className="pb-2 text-right text-gray-500">Balance</th>
                  <th className="pb-2 text-left text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.repayments.map((r) => {
                  const statusCfg: Record<string, string> = {
                    pending: "text-gray-600",
                    partial: "text-yellow-600",
                    paid:    "text-green-600",
                    overdue: "text-red-600",
                  };
                  return (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-1.5">{new Date(r.due_date).toLocaleDateString("en-KE")}</td>
                      <td className="py-1.5 text-right">KES {Number(r.total_due).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right">KES {Number(r.total_paid).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right">KES {Number(r.balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className={`py-1.5 capitalize font-medium ${statusCfg[r.repayment_status] ?? ""}`}>
                        {r.repayment_status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemberLoansPage() {
  const { data, isLoading, error } = useMemberLoans({ per_page: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;

  const loans = data?.data ?? [];
  const effectiveId = selectedId ?? loans[0]?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">My Loans</h1>

      {!loans.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400">No loans found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            {loans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                selected={effectiveId === loan.id}
                onClick={() => setSelectedId(loan.id)}
              />
            ))}
          </div>
          <div className="lg:col-span-2">
            {effectiveId && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
                <h2 className="mb-4 font-semibold text-dark dark:text-white">Loan Details</h2>
                <LoanDetail loanId={effectiveId} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
