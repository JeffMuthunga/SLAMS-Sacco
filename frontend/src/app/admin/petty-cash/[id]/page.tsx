"use client";

import React, { use, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import {
  PettyCashRequest,
  useApprovePettyCashAllocation,
  useApprovePettyCashRequest,
  useCreatePettyCashRequest,
  useDeletePettyCashRequest,
  usePettyCashAllocations,
  usePettyCashItems,
  usePettyCashRequests,
  useRejectPettyCashAllocation,
  useRejectPettyCashRequest,
} from "@/lib/api/petty-cash";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";

function fmt(v: string) {
  return parseFloat(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

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

interface RequestFormState {
  item_id: string;
  units: string;
  unit_price: string;
  receipt_number: string;
  expense_date: string;
  narration: string;
}

const EMPTY_REQ: RequestFormState = {
  item_id: "", units: "1", unit_price: "", receipt_number: "",
  expense_date: new Date().toISOString().slice(0, 10), narration: "",
};

export default function AllocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqForm, setReqForm]                 = useState<RequestFormState>({ ...EMPTY_REQ });
  const [reqErrors, setReqErrors]             = useState<Record<string, string[]> | null>(null);

  const { data: allocationData } = usePettyCashAllocations({ per_page: 200 });
  const allocation = allocationData?.data.find((a) => a.id === id);

  const { data: items = [] }   = usePettyCashItems();
  const { data: reqData }      = usePettyCashRequests({ allocation_id: id, per_page: 100 });
  const requests: PettyCashRequest[] = reqData?.data ?? [];

  const approveMutation    = useApprovePettyCashAllocation();
  const rejectMutation     = useRejectPettyCashAllocation();
  const createReqMutation  = useCreatePettyCashRequest();
  const approveReqMutation = useApprovePettyCashRequest();
  const rejectReqMutation  = useRejectPettyCashRequest();
  const deleteReqMutation  = useDeletePettyCashRequest();

  const setReq = (k: keyof RequestFormState, v: string) =>
    setReqForm((f) => ({ ...f, [k]: v }));

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setReqErrors(null);

    createReqMutation.mutate(
      {
        allocation_id: id,
        item_id: reqForm.item_id || undefined,
        units: parseInt(reqForm.units),
        unit_price: reqForm.unit_price,
        receipt_number: reqForm.receipt_number || undefined,
        expense_date: reqForm.expense_date,
        narration: reqForm.narration || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Request created.");
          setShowRequestForm(false);
          setReqForm({ ...EMPTY_REQ });
        },
        onError: (err) => {
          const fe = extractFieldErrors(err);
          if (fe) { setReqErrors(fe); } else { toast.error(extractApiError(err)); }
        },
      }
    );
  };

  const err = (k: string) => reqErrors?.[k]?.[0];

  const handleApproveReq = (reqId: string) =>
    approveReqMutation.mutate(reqId, {
      onSuccess: () => toast.success("Request approved."),
      onError: (e) => toast.error(extractApiError(e)),
    });

  const handleRejectReq = (reqId: string) =>
    rejectReqMutation.mutate(reqId, {
      onSuccess: () => toast.success("Request rejected."),
      onError: (e) => toast.error(extractApiError(e)),
    });

  const handleDeleteReq = (reqId: string) => {
    if (!confirm("Delete this request?")) return;
    deleteReqMutation.mutate(reqId, {
      onSuccess: () => toast.success("Request deleted."),
      onError: (e) => toast.error(extractApiError(e)),
    });
  };

  const reqColumns = useMemo<ColumnDef<PettyCashRequest>[]>(() => [
    {
      id: "item",
      header: "Item",
      cell: ({ row }) => row.original.item?.name ?? "—",
    },
    {
      accessorKey: "expense_date",
      header: "Date",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-KE"),
    },
    { accessorKey: "units", header: "Units" },
    {
      accessorKey: "unit_price",
      header: "Unit Price",
      cell: ({ getValue }) => <span className="font-mono">{fmt(getValue<string>())}</span>,
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        if (r.approval_status === "approved") return <span className="text-xs text-gray-400">Approved</span>;
        if (r.approval_status === "rejected") return <span className="text-xs text-gray-400">Rejected</span>;
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => handleApproveReq(r.id)} className="text-xs text-green-700 hover:underline">Approve</button>
            <button onClick={() => handleRejectReq(r.id)} className="text-xs text-red-600 hover:underline">Reject</button>
            <button onClick={() => handleDeleteReq(r.id)} className="text-xs text-gray-500 hover:underline">Delete</button>
          </div>
        );
      },
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!allocation) return <p className="p-6 text-gray-500">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Petty Cash Allocation
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {allocation.user?.name}
            {allocation.period && <> · {allocation.period.name}</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={allocation.approval_status} />
          {(allocation.approval_status === "draft" || allocation.approval_status === "pending") && (
            <button
              onClick={() => approveMutation.mutate(id, {
                onSuccess: () => toast.success("Approved."),
                onError: (e) => toast.error(extractApiError(e)),
              })}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Approve
            </button>
          )}
          {allocation.approval_status === "pending" && (
            <button
              onClick={() => rejectMutation.mutate(id, {
                onSuccess: () => toast.success("Rejected."),
                onError: (e) => toast.error(extractApiError(e)),
              })}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Allocated", value: fmt(allocation.amount) },
          { label: "Spent",     value: fmt(allocation.spent) },
          { label: "Balance",   value: fmt(allocation.balance) },
          { label: "Narration", value: allocation.narration ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 font-semibold text-dark dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Requests */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark dark:text-white">Expense Requests</h2>
          {allocation.approval_status === "approved" && !showRequestForm && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-opacity-90"
            >
              + Add Request
            </button>
          )}
        </div>

        {showRequestForm && (
          <form onSubmit={handleCreateRequest} className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-medium">Item</label>
              <select
                value={reqForm.item_id}
                onChange={(e) => {
                  const item = items.find((i) => i.id === e.target.value);
                  setReq("item_id", e.target.value);
                  if (item) { setReq("unit_price", item.default_price); setReq("units", String(item.default_units)); }
                }}
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
              >
                <option value="">— optional —</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Units</label>
              <input type="number" min="1" value={reqForm.units} onChange={(e) => setReq("units", e.target.value)} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Unit Price</label>
              <input type="number" step="0.01" min="0.01" value={reqForm.unit_price} onChange={(e) => setReq("unit_price", e.target.value)} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs" />
              {err("unit_price") && <p className="text-xs text-red-500">{err("unit_price")}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Date</label>
              <input type="date" value={reqForm.expense_date} onChange={(e) => setReq("expense_date", e.target.value)} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Receipt #</label>
              <input value={reqForm.receipt_number} onChange={(e) => setReq("receipt_number", e.target.value)} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Narration</label>
              <input value={reqForm.narration} onChange={(e) => setReq("narration", e.target.value)} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs" />
            </div>
            <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
              <button type="submit" disabled={createReqMutation.isPending} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-opacity-90 disabled:opacity-50">
                {createReqMutation.isPending ? "Saving…" : "Save Request"}
              </button>
              <button type="button" onClick={() => setShowRequestForm(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        <DataTable columns={reqColumns} data={requests} heading="Requests" showExportButton />
      </div>
    </div>
  );
}
