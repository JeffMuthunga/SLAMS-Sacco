"use client";

import React, { useState } from "react";
import { useMemberContributions } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";
import type { ContributionStatus } from "@/lib/api/contributions";

const STATUS_CFG: Record<ContributionStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-600" },
  partial: { label: "Partial", className: "bg-yellow-100 text-yellow-700" },
  paid:    { label: "Paid",    className: "bg-green-100 text-green-700" },
  waived:  { label: "Waived",  className: "bg-blue-100 text-blue-700" },
};

export default function MemberContributionsPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading, error } = useMemberContributions({ status: status || undefined, per_page: 100 });

  const contributions = data?.data ?? [];

  const totalExpected = contributions.reduce((s, c) => s + Number(c.expected_amount), 0);
  const totalPaid     = contributions.reduce((s, c) => s + Number(c.paid_amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">My Contributions</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Expected", value: `KES ${totalExpected.toLocaleString("en-KE", { minimumFractionDigits: 2 })}` },
          { label: "Total Paid",     value: `KES ${totalPaid.toLocaleString("en-KE", { minimumFractionDigits: 2 })}` },
          { label: "Pending",        value: String(contributions.filter((c) => c.status === "pending").length) },
          { label: "Paid",           value: String(contributions.filter((c) => c.status === "paid").length) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-dark dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Filter by status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
          <option value="">All</option>
          {(["pending", "partial", "paid", "waived"] as ContributionStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading…</p>
        ) : !contributions.length ? (
          <p className="p-6 text-sm text-gray-400 italic">No contributions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs text-gray-500">Period</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500">Expected</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500">Paid</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500">Paid Date</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => {
                  const sCfg = STATUS_CFG[c.status];
                  return (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="px-4 py-3">{c.period?.name ?? "—"}</td>
                      <td className="px-4 py-3">{new Date(c.due_date).toLocaleDateString("en-KE")}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        KES {Number(c.expected_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        KES {Number(c.paid_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sCfg.className}`}>
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.paid_date ? new Date(c.paid_date).toLocaleDateString("en-KE") : "—"}
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
