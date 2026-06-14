"use client";

import React from "react";
import { useMemberGuarantees } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";

function LoanStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    draft:     "bg-gray-100 text-gray-600",
    applied:   "bg-blue-100 text-blue-700",
    approved:  "bg-yellow-100 text-yellow-700",
    disbursed: "bg-green-100 text-green-700",
    active:    "bg-green-100 text-green-700",
    repaid:    "bg-gray-100 text-gray-600",
    defaulted: "bg-red-100 text-red-700",
    rejected:  "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function GuaranteesView({ status, title }: { status?: string; title: string }) {
  const { data, isLoading, error } = useMemberGuarantees({ status, per_page: 50 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">{title}</h1>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400">No guarantees found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.data.map((g) => (
            <div key={g.id} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-500">{g.loan?.account_number}</span>
                    {g.loan && <LoanStatusBadge status={g.loan.loan_status} />}
                    {!g.is_accepted && g.is_active && (
                      <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">Pending</span>
                    )}
                    {!g.is_active && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Closed</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Borrower: <span className="font-medium text-dark dark:text-white">{g.loan?.member?.full_name ?? "—"}</span>
                    {g.loan?.member?.member_number && <span className="ml-1 text-gray-400">({g.loan.member.member_number})</span>}
                  </p>
                  {g.loan?.loan_product && (
                    <p className="text-xs text-gray-400">Product: {g.loan.loan_product.name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Guaranteed Amount</p>
                  <p className="text-lg font-bold text-dark dark:text-white">
                    BWP {Number(g.guaranteed_amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                  </p>
                  {g.accepted_at && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Accepted {new Date(g.accepted_at).toLocaleDateString("en-BW")}
                    </p>
                  )}
                </div>
              </div>
              {g.loan && (
                <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500">
                    Loan Principal:{" "}
                    <span className="font-medium text-dark dark:text-white">
                      BWP {Number(g.loan.principal_amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
