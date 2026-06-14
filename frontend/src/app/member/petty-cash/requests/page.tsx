"use client";

import React from "react";
import { useMemberPettyCashRequests } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";

export default function MemberPettyCashRequestsPage() {
  const { data, isLoading, error } = useMemberPettyCashRequests({ per_page: 50 });
  const requests = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">My Petty Cash Requests</h1>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !requests.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400">No requests found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-xs text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Item</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Narration</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const statusCfg: Record<string, string> = {
                  pending:  "bg-gray-100 text-gray-600",
                  approved: "bg-green-100 text-green-700",
                  rejected: "bg-red-100 text-red-700",
                };
                return (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.expense_date ? new Date(r.expense_date).toLocaleDateString("en-BW") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {(r.item as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.narration ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      BWP {Number(r.amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg[r.approval_status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.approval_status.charAt(0).toUpperCase() + r.approval_status.slice(1)}
                      </span>
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
