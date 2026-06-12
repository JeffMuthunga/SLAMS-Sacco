"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { RepaymentStatusBadge } from "./LoanStatusBadge";
import { LoanRepayment, useRecordRepayment } from "@/lib/api/loans";
import { extractApiError } from "@/lib/api";

function fmt(v: string) {
  return parseFloat(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

interface Props {
  loanId: string;
  data: LoanRepayment[];
  isActive: boolean;
}

export default function RepaymentScheduleTable({ loanId, data, isActive }: Props) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const recordPayment = useRecordRepayment();

  const handlePay = async (repayment: LoanRepayment) => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        loanId,
        repaymentId: repayment.id,
        amount: payAmount,
      });
      toast.success("Repayment recorded.");
      setPayingId(null);
      setPayAmount("");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const columns = useMemo<ColumnDef<LoanRepayment>[]>(() => [
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-KE"),
    },
    {
      accessorKey: "total_due",
      header: "Total Due",
      cell: ({ getValue }) => <span className="font-mono">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "total_paid",
      header: "Paid",
      cell: ({ getValue }) => <span className="font-mono text-green-600">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ getValue }) => <span className="font-mono text-red-600">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "paid_date",
      header: "Paid Date",
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? new Date(v).toLocaleDateString("en-KE") : "—";
      },
    },
    {
      accessorKey: "repayment_status",
      header: "Status",
      cell: ({ getValue }) => <RepaymentStatusBadge status={getValue<string>()} />,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const r = row.original;
        if (!isActive || r.repayment_status === "paid") return null;

        if (payingId === r.id) {
          return (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={fmt(r.balance)}
                min={0.01}
                step="any"
                className="w-28 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-green-600"
              />
              <button
                onClick={() => handlePay(r)}
                disabled={recordPayment.isPending}
                className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-60"
              >
                Pay
              </button>
              <button
                onClick={() => { setPayingId(null); setPayAmount(""); }}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          );
        }

        return (
          <button
            onClick={() => { setPayingId(r.id); setPayAmount(fmt(r.balance).replace(/,/g, "")); }}
            className="rounded px-2 py-1 text-xs font-medium text-primary hover:underline"
          >
            Record Payment
          </button>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [loanId, payingId, payAmount, isActive, recordPayment.isPending]);

  return (
    <DataTable
      columns={columns}
      data={data}
      heading="Repayment Schedule"
      showExportButton
    />
  );
}
