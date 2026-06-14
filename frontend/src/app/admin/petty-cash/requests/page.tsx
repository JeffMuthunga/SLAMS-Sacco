"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import {
  PettyCashRequest,
  useApprovePettyCashRequest,
  useDeletePettyCashRequest,
  usePettyCashRequests,
  useRejectPettyCashRequest,
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
  return parseFloat(v).toLocaleString("en-BW", { minimumFractionDigits: 2 });
}

export default function PettyCashRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = usePettyCashRequests({
    approval_status: statusFilter || undefined,
    per_page: 100,
  });

  const approveMutation = useApprovePettyCashRequest();
  const rejectMutation  = useRejectPettyCashRequest();
  const deleteMutation  = useDeletePettyCashRequest();

  const handleApprove = (id: string) =>
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Request approved."),
      onError: (err) => toast.error(extractApiError(err)),
    });

  const handleReject = (id: string) =>
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success("Request rejected."),
      onError: (err) => toast.error(extractApiError(err)),
    });

  const handleDelete = (id: string) => {
    if (!confirm("Delete this request?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Request deleted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const columns = useMemo<ColumnDef<PettyCashRequest>[]>(() => [
    {
      id: "requester",
      header: "Requester",
      cell: ({ row }) => row.original.requester?.name ?? "—",
    },
    {
      id: "item",
      header: "Item",
      cell: ({ row }) => row.original.item?.name ?? "—",
    },
    {
      accessorKey: "expense_date",
      header: "Date",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-BW"),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => <span className="font-mono font-medium">{fmt(getValue<string>())}</span>,
    },
    {
      accessorKey: "receipt_number",
      header: "Receipt #",
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
    },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      id: "allocation",
      header: "Allocation",
      cell: ({ row }) => {
        const r = row.original;
        return r.allocation_id ? (
          <Link href={`/admin/petty-cash/${r.allocation_id}`} className="text-xs text-primary hover:underline">
            View
          </Link>
        ) : "—";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        if (r.approval_status === "approved" || r.approval_status === "rejected") {
          return <span className="text-xs text-gray-400">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => handleApprove(r.id)} className="text-xs text-green-700 hover:underline">Approve</button>
            <button onClick={() => handleReject(r.id)} className="text-xs text-red-600 hover:underline">Reject</button>
            <button onClick={() => handleDelete(r.id)} className="text-xs text-gray-500 hover:underline">Delete</button>
          </div>
        );
      },
    },
  ], [approveMutation.isPending, rejectMutation.isPending, deleteMutation.isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">All Petty Cash Requests</h1>
        <Link href="/admin/petty-cash" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
          ← Allocations
        </Link>
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

      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Petty Cash Requests"
        showExportButton
      />
    </div>
  );
}
