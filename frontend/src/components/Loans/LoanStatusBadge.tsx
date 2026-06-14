import React from "react";
import { LoanStatus } from "@/lib/api/loans";

const STATUS_CONFIG: Record<LoanStatus, { label: string; className: string }> = {
  draft:                { label: "Draft",                className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  applied:              { label: "Applied",              className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  guarantors_confirmed: { label: "Guarantors Confirmed", className: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" },
  approved:             { label: "Approved",             className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  rejected:             { label: "Rejected",             className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  disbursed:            { label: "Disbursed",            className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  active:               { label: "Active",               className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  repaid:               { label: "Repaid",               className: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" },
  defaulted:            { label: "Defaulted",            className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
};

const REPAYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  partial: { label: "Partial", className: "bg-yellow-100 text-yellow-700" },
  paid:    { label: "Paid",    className: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
};

export function LoanStatusBadge({ status }: { status: LoanStatus | string }) {
  const cfg = STATUS_CONFIG[status as LoanStatus] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function RepaymentStatusBadge({ status }: { status: string }) {
  const cfg = REPAYMENT_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
