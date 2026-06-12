import React from "react";

type Status = "draft" | "pending" | "approved" | "rejected";

const CONFIG: Record<Status, { label: string; className: string }> = {
  draft:    { label: "Draft",    className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  pending:  { label: "Pending",  className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

interface Props {
  status: Status | string;
}

export default function ApprovalStatusBadge({ status }: Props) {
  const cfg = CONFIG[status as Status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
