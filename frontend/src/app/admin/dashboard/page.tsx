"use client";

import React from "react";
import Link from "next/link";
import { useAdminDashboard, type RecentLoan } from "@/lib/api/dashboard";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";

function fmt(v: string | number | null | undefined, currency = false): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return currency
    ? `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
    : n.toLocaleString("en-KE");
}

function StatCard({
  label,
  value,
  sub,
  subLabel,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string | number;
  subLabel?: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark h-full">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-dark dark:text-white">{value}</p>
      {sub !== undefined && (
        <p className="mt-1 text-xs text-gray-400">
          {subLabel && <span className="mr-1">{subLabel}</span>}
          {sub}
        </p>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function AlertBadge({
  count,
  label,
  href,
}: {
  count: number;
  label: string;
  href: string;
}) {
  if (count === 0) return null;
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700 hover:bg-orange-100 transition-colors dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
      {label}
    </Link>
  );
}

const loanColumns: ColumnDef<RecentLoan>[] = [
  { accessorKey: "member_number", header: "Member #" },
  { accessorKey: "member_name",   header: "Member" },
  { accessorKey: "product",       header: "Product", cell: ({ getValue }) => getValue<string>() ?? "—" },
  {
    accessorKey: "principal",
    header: "Principal",
    cell: ({ getValue }) => fmt(getValue<string>(), true),
  },
  {
    accessorKey: "loan_status",
    header: "Status",
    cell: ({ getValue }) => {
      const v = getValue<string>();
      const colours: Record<string, string> = {
        draft:     "bg-gray-100 text-gray-600",
        applied:   "bg-blue-100 text-blue-700",
        approved:  "bg-green-100 text-green-700",
        active:    "bg-green-100 text-green-700",
        repaid:    "bg-teal-100 text-teal-700",
        rejected:  "bg-red-100 text-red-700",
        defaulted: "bg-red-200 text-red-800",
      };
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colours[v] ?? "bg-gray-100 text-gray-600"}`}>
          {v}
        </span>
      );
    },
  },
  {
    accessorKey: "approval_status",
    header: "Approval",
    cell: ({ getValue }) => {
      const v = getValue<string>();
      const colours: Record<string, string> = {
        pending:  "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
      };
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colours[v] ?? "bg-gray-100 text-gray-600"}`}>
          {v}
        </span>
      );
    },
  },
  {
    accessorKey: "applied_at",
    header: "Applied",
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return v ? new Date(v).toLocaleDateString("en-KE") : "—";
    },
  },
];

export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  const stats = data?.stats;
  const recentLoans = data?.recent_loans ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">SACCO overview</p>
      </div>

      {/* Pending action alerts */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <AlertBadge
            count={stats.pending_members}
            label="member approvals pending"
            href="/admin/members"
          />
          <AlertBadge
            count={stats.pending_loan_approvals}
            label="loan approvals pending"
            href="/admin/loans"
          />
          <AlertBadge
            count={stats.open_issues}
            label="open issues"
            href="/admin/issues"
          />
        </div>
      )}

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Members"
            value={fmt(stats?.total_members)}
            href="/admin/members"
          />
          <StatCard
            label="Active Loans"
            value={fmt(stats?.active_loans)}
            sub={fmt(stats?.total_loan_portfolio, true)}
            subLabel="Portfolio:"
            href="/admin/loans"
          />
          <StatCard
            label="Total Savings"
            value={fmt(stats?.total_savings, true)}
            href="/admin/accounts"
          />
          <StatCard
            label="Contributions This Month"
            value={fmt(stats?.contributions_this_month, true)}
            href="/admin/contributions"
          />
        </div>
      )}

      {/* Recent loan applications */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-dark dark:text-white">Recent Loan Applications</h2>
          <Link
            href="/admin/loans"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <DataTable
          columns={loanColumns}
          data={recentLoans}
        />
      </div>
    </div>
  );
}
