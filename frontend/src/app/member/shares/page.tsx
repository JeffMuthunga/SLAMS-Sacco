"use client";

import React from "react";
import { useMyShares, type MemberShare } from "@/lib/api/shares";
import { extractApiError } from "@/lib/api";

// ── Status badge ─────────────────────────────────────────────────────────

const STATUS_CFG: Record<MemberShare["status"], { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700"  },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700"      },
};

function StatusBadge({ status }: { status: MemberShare["status"] }) {
  const cfg = STATUS_CFG[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-dark dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function MemberSharesPage() {
  const { data, isLoading, error } = useMyShares();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Shares</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Shares</h1>
        <p className="text-sm text-red-500">{extractApiError(error)}</p>
      </div>
    );
  }

  const shares = data?.shares ?? [];
  const balance = data?.balance;
  const summary = balance?.summary ?? [];

  const fmt = (v: string | number) =>
    `BWP ${Number(v).toLocaleString("en-BW", { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">My Shares</h1>

      {/* ── Balance summary cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Total Share Value"
          value={balance ? fmt(balance.total_value) : "BWP 0.00"}
        />
        {summary.map((s) => (
          <SummaryCard
            key={s.product_name}
            label={s.product_name}
            value={fmt(s.total_value)}
            sub={`${s.quantity.toLocaleString("en-BW")} shares held`}
          />
        ))}
      </div>

      {/* ── Transactions table ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
        <h2 className="mb-4 font-semibold text-dark dark:text-white">Share Transactions</h2>

        {!shares.length ? (
          <p className="text-sm italic text-gray-400">No share transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-xs text-gray-500">Share Product</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Quantity</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Price / Share</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Total Amount</th>
                  <th className="pb-2 text-left text-xs text-gray-500">Purchase Date</th>
                  <th className="pb-2 text-left text-xs text-gray-500">Status</th>
                  <th className="pb-2 text-left text-xs text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shares.map((share) => (
                  <tr
                    key={share.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-700"
                  >
                    <td className="py-2 font-medium text-dark dark:text-white">
                      {share.share_product?.name ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      {share.quantity.toLocaleString("en-BW")}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {fmt(share.price_per_share)}
                    </td>
                    <td className="py-2 text-right font-mono font-medium">
                      {fmt(share.total_amount)}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      {new Date(share.purchase_date).toLocaleDateString("en-BW")}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={share.status} />
                    </td>
                    <td className="py-2 max-w-[200px] truncate text-gray-500">
                      {share.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
