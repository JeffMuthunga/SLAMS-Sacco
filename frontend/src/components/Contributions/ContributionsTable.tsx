"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { ContributionStatusBadge } from "./ContributionStatusBadge";
import { Contribution, useContributions, usePayContribution, useWaiveContribution } from "@/lib/api/contributions";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { label: "All",     value: "" },
  { label: "Pending", value: "pending" },
  { label: "Partial", value: "partial" },
  { label: "Paid",    value: "paid" },
  { label: "Waived",  value: "waived" },
];

function fmt(v: string) {
  return parseFloat(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

interface Props {
  periodId?: string;
  memberId?: string;
}

export default function ContributionsTable({ periodId, memberId }: Props) {
  const [search, setSearch]               = useState("");
  const [status, setStatus]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [payingId, setPayingId]           = useState<string | null>(null);
  const [payAmount, setPayAmount]         = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, error } = useContributions({
    period_id: periodId,
    member_id: memberId,
    search: debouncedSearch || undefined,
    status: status || undefined,
    per_page: 100,
  });

  const payMutation   = usePayContribution();
  const waiveMutation = useWaiveContribution();

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const handlePay = (row: Contribution) => {
    if (!payAmount) return;
    payMutation.mutate(
      { id: row.id, amount: payAmount },
      {
        onSuccess: () => { toast.success("Payment recorded."); setPayingId(null); setPayAmount(""); },
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  };

  const handleWaive = (row: Contribution) => {
    waiveMutation.mutate(row.id, {
      onSuccess: () => toast.success("Contribution waived."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const columns = useMemo<ColumnDef<Contribution>[]>(() => [
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => {
        const m = row.original.member;
        return m ? `${m.full_name} (${m.member_number})` : "—";
      },
    },
    {
      id: "period",
      header: "Period",
      cell: ({ row }) => row.original.period?.name ?? "—",
    },
    {
      accessorKey: "expected_amount",
      header: "Expected",
      cell: ({ getValue }) => <span className="font-mono">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "paid_amount",
      header: "Paid",
      cell: ({ getValue }) => <span className="font-mono">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? new Date(v).toLocaleDateString("en-KE") : "—";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <ContributionStatusBadge status={getValue<string>()} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const c = row.original;
        if (c.status === "paid" || c.status === "waived") {
          return <span className="text-xs text-gray-400">{c.status === "paid" ? "Paid" : "Waived"}</span>;
        }
        if (payingId === c.id) {
          return (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-24 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <button
                onClick={() => handlePay(c)}
                disabled={payMutation.isPending}
                className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                Pay
              </button>
              <button
                onClick={() => { setPayingId(null); setPayAmount(""); }}
                className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPayingId(c.id); setPayAmount(""); }}
              className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:underline"
            >
              Pay
            </button>
            <button
              onClick={() => handleWaive(c)}
              disabled={waiveMutation.isPending}
              className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:underline disabled:opacity-50"
            >
              Waive
            </button>
          </div>
        );
      },
    },
  ], [payingId, payAmount, payMutation.isPending, waiveMutation.isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {!periodId && !memberId && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search member name, number…"
            value={search}
            onChange={handleSearchChange}
            className="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Contributions"
        showExportButton
      />

      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}
