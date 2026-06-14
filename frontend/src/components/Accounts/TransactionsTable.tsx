"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { TransactionTypeBadge, isDebitType } from "./AccountStatusBadge";
import { AccountTransaction } from "@/lib/api/accounts";

function formatAmount(value: string): string {
  return parseFloat(value).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  data: AccountTransaction[];
  isLoading?: boolean;
}

export default function TransactionsTable({ data, isLoading }: Props) {
  const columns = useMemo<ColumnDef<AccountTransaction>[]>(() => [
    {
      accessorKey: "transaction_date",
      header: "Date",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? new Date(v).toLocaleDateString("en-BW") : "—";
      },
      enableSorting: true,
    },
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ getValue }) => <TransactionTypeBadge type={getValue<string>()} />,
    },
    {
      accessorKey: "narration",
      header: "Narration",
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const debit = isDebitType(row.original.transaction_type);
        return (
          <span className={`font-mono ${debit ? "text-red-600" : "text-green-600"}`}>
            {debit ? "−" : "+"}{formatAmount(row.original.amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "balance_after",
      header: "Balance After",
      cell: ({ getValue }) => (
        <span className="font-mono">{formatAmount(getValue<string>())}</span>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-2">
      <DataTable
        columns={columns}
        data={data}
        heading="Transactions"
        showExportButton
      />
      {isLoading && (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      )}
    </div>
  );
}
