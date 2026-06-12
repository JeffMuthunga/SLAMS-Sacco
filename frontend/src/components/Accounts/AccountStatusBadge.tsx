import React from "react";

type Status = "draft" | "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  draft:    { label: "Draft",    className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  pending:  { label: "Pending",  className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

type TxType =
  | "deposit" | "withdrawal" | "interest_credit" | "fee"
  | "transfer_in" | "transfer_out" | "loan_disbursement" | "loan_repayment" | "contribution";

const TX_CONFIG: Record<TxType, { label: string; className: string }> = {
  deposit:          { label: "Deposit",          className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  transfer_in:      { label: "Transfer In",      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  loan_repayment:   { label: "Loan Repayment",   className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  contribution:     { label: "Contribution",     className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  interest_credit:  { label: "Interest Credit",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  withdrawal:       { label: "Withdrawal",       className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  transfer_out:     { label: "Transfer Out",     className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  fee:              { label: "Fee",              className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  loan_disbursement:{ label: "Loan Disbursement",className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

const DEBIT_TYPES: TxType[] = ["withdrawal", "transfer_out", "fee", "loan_disbursement"];

export function AccountStatusBadge({ status }: { status: Status | string }) {
  const cfg = STATUS_CONFIG[status as Status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function TransactionTypeBadge({ type }: { type: TxType | string }) {
  const cfg = TX_CONFIG[type as TxType] ?? { label: type, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function isDebitType(type: string): boolean {
  return DEBIT_TYPES.includes(type as TxType);
}
