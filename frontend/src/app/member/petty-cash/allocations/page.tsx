"use client";

import React from "react";
import { useMemberPettyCashAllocations } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";

export default function MemberAllocationsPage() {
  const { data, isLoading, error } = useMemberPettyCashAllocations({ per_page: 20 });
  const allocations = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">My Petty Cash Allocations</h1>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !allocations.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400">No allocations found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-xs text-gray-500">Period</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500">Allocated</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500">Spent</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500">Balance</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => {
                const statusCfg: Record<string, string> = {
                  pending:  "bg-gray-100 text-gray-600",
                  approved: "bg-green-100 text-green-700",
                  rejected: "bg-red-100 text-red-700",
                };
                return (
                  <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="px-4 py-3">
                      {(a.period as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      KES {Number(a.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      KES {Number(a.spent).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      KES {Number(a.balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg[a.approval_status] ?? "bg-gray-100 text-gray-600"}`}>
                        {a.approval_status.charAt(0).toUpperCase() + a.approval_status.slice(1)}
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
