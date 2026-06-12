"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import {
  PettyCashAllocation,
  usePettyCashAllocations,
  useApprovePettyCashAllocation,
  useRejectPettyCashAllocation,
  useDeletePettyCashAllocation,
} from "@/lib/api/petty-cash";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { label: "All",      value: "" },
  { label: "Draft",    value: "draft" },
  { label: "Pending",  value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    draft:    "bg-gray-100 text-gray-700",
    pending:  "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function fmt(v: string) {
  return parseFloat(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

export default function PettyCashPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = usePettyCashAllocations({
    approval_status: statusFilter || undefined,
    per_page: 100,
  });

  const approveMutation = useApprovePettyCashAllocation();
  const rejectMutation  = useRejectPettyCashAllocation();
  const deleteMutation  = useDeletePettyCashAllocation();

  const handleApprove = (id: string) =>
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Allocation approved."),
      onError: (err) => toast.error(extractApiError(err)),
    });

  const handleReject = (id: string) =>
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success("Allocation rejected."),
      onError: (err) => toast.error(extractApiError(err)),
    });

  const handleDelete = (id: string) => {
    if (!confirm("Delete this allocation?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Allocation deleted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const columns = useMemo<ColumnDef<PettyCashAllocation>[]>(() => [
    {
      id: "user",
      header: "Allocated To",
      cell: ({ row }) => {
        const u = row.original.user;
        return u ? `${u.name} (${u.email})` : "—";
      },
    },
    {
      id: "period",
      header: "Period",
      cell: ({ row }) => row.original.period?.name ?? "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => <span className="font-mono">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "spent",
      header: "Spent",
      cell: ({ getValue }) => <span className="font-mono">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ getValue }) => <span className="font-mono font-medium">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/admin/petty-cash/${a.id}`} className="text-xs text-primary hover:underline">
              View
            </Link>
            {a.approval_status === "draft" && (
              <>
                <button onClick={() => handleApprove(a.id)} className="text-xs text-green-700 hover:underline">
                  Approve
                </button>
                <button onClick={() => handleDelete(a.id)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </>
            )}
            {a.approval_status === "pending" && (
              <>
                <button onClick={() => handleApprove(a.id)} className="text-xs text-green-700 hover:underline">
                  Approve
                </button>
                <button onClick={() => handleReject(a.id)} className="text-xs text-red-600 hover:underline">
                  Reject
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ], [approveMutation.isPending, rejectMutation.isPending, deleteMutation.isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Petty Cash Allocations</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/petty-cash/requests"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            All Requests
          </Link>
          <Link
            href="/admin/petty-cash/create"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            + New Allocation
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Allocations"
        showExportButton
      />

      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}
