import React from "react";
import { ContributionStatus } from "@/lib/api/contributions";

const STATUS_CONFIG: Record<ContributionStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  partial: { label: "Partial", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  paid:    { label: "Paid",    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  waived:  { label: "Waived",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

export function ContributionStatusBadge({ status }: { status: ContributionStatus | string }) {
  const cfg = STATUS_CONFIG[status as ContributionStatus] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
