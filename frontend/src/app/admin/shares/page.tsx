"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import {
  MemberShare,
  useApproveShare,
  useCreateMemberShare,
  useMemberShares,
  useRejectShare,
  useShareProducts,
} from "@/lib/api/shares";
import { useMembers } from "@/lib/api/members";
import { extractApiError } from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending",      value: "pending" },
  { label: "Approved",     value: "approved" },
  { label: "Rejected",     value: "rejected" },
];

function fmtBwp(v: string | number) {
  return (
    "BWP " +
    parseFloat(String(v)).toLocaleString("en-BW", { minimumFractionDigits: 2 })
  );
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-BW");
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

// ── Create Modal ───────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
}

function CreateShareModal({ onClose }: CreateModalProps) {
  const { data: members, isLoading: loadingMembers } = useMembers({ per_page: 500 });
  const { data: products, isLoading: loadingProducts } = useShareProducts();
  const createMutation = useCreateMemberShare();

  const [form, setForm] = useState({
    member_id: "",
    share_product_id: "",
    quantity: "",
    purchase_date: new Date().toISOString().split("T")[0],
    deposit_account_id: "",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    if (!form.member_id) {
      setFieldErrors((p) => ({ ...p, member_id: "Required" }));
      return;
    }
    if (!form.share_product_id) {
      setFieldErrors((p) => ({ ...p, share_product_id: "Required" }));
      return;
    }
    if (!form.quantity || Number(form.quantity) < 1) {
      setFieldErrors((p) => ({ ...p, quantity: "Must be at least 1" }));
      return;
    }

    try {
      await createMutation.mutateAsync({
        member_id:         form.member_id,
        share_product_id:  form.share_product_id,
        quantity:          Number(form.quantity),
        purchase_date:     form.purchase_date || undefined,
        deposit_account_id: form.deposit_account_id || undefined,
        notes:             form.notes || undefined,
      });
      toast.success("Share purchase recorded");
      onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Record Share Purchase
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Member */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Member <span className="text-red-500">*</span>
            </label>
            <select
              value={form.member_id}
              onChange={(e) => setField("member_id", e.target.value)}
              disabled={loadingMembers}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select member…</option>
              {members?.data.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number})
                </option>
              ))}
            </select>
            {fieldErrors.member_id && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.member_id}</p>
            )}
          </div>

          {/* Share Product */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Share Product <span className="text-red-500">*</span>
            </label>
            <select
              value={form.share_product_id}
              onChange={(e) => setField("share_product_id", e.target.value)}
              disabled={loadingProducts}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select product…</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({fmtBwp(p.price_per_share)} / share)
                </option>
              ))}
            </select>
            {fieldErrors.share_product_id && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.share_product_id}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. 10"
            />
            {fieldErrors.quantity && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.quantity}</p>
            )}
          </div>

          {/* Purchase Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Purchase Date
            </label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) => setField("purchase_date", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Deposit Account (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deposit Account ID <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.deposit_account_id}
              onChange={(e) => setField("deposit_account_id", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 dark:bg-gray-700 dark:text-white"
              placeholder="Account UUID"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 dark:bg-gray-700 dark:text-white"
              placeholder="Any additional notes…"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
            >
              {createMutation.isPending ? "Saving…" : "Record Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reject Reason Modal ────────────────────────────────────────────────────

interface RejectModalProps {
  shareId: string;
  onClose: () => void;
}

function RejectModal({ shareId, onClose }: RejectModalProps) {
  const rejectMutation = useRejectShare();
  const [reason, setReason] = useState("");

  async function handleReject() {
    try {
      await rejectMutation.mutateAsync({ id: shareId, reason: reason || undefined });
      toast.success("Share purchase rejected");
      onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-dark dark:text-white">
          Reject Share Purchase
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Optionally provide a reason for rejection.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)…"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-red-400 focus:ring-2 focus:ring-red-400 dark:bg-gray-700 dark:text-white"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={rejectMutation.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {rejectMutation.isPending ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminSharesPage() {
  const [status, setStatus]         = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [rejectId, setRejectId]     = useState<string | null>(null);

  const approveMutation = useApproveShare();

  const { data, isLoading, error } = useMemberShares({
    status:   status || undefined,
    per_page: 200,
  });

  async function handleApprove(id: string) {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Share purchase approved");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  const columns = useMemo<ColumnDef<MemberShare>[]>(
    () => [
      {
        id: "member",
        header: "Member",
        cell: ({ row }) => {
          const m = row.original.member;
          return m ? (
            <span>
              {m.full_name}
              <span className="ml-1 text-xs text-gray-500">({m.member_number})</span>
            </span>
          ) : (
            "—"
          );
        },
      },
      {
        id: "share_product",
        header: "Share Product",
        cell: ({ row }) => row.original.share_product?.name ?? "—",
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ getValue }) => (
          <span className="font-mono">{getValue<number>().toLocaleString("en-BW")}</span>
        ),
      },
      {
        accessorKey: "price_per_share",
        header: "Price / Share",
        cell: ({ getValue }) => (
          <span className="font-mono">{fmtBwp(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "total_amount",
        header: "Total Amount",
        cell: ({ getValue }) => (
          <span className="font-mono font-medium">{fmtBwp(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "purchase_date",
        header: "Purchase Date",
        cell: ({ getValue }) => fmtDate(getValue<string>()),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const share = row.original;
          if (share.status !== "pending") return null;
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprove(share.id)}
                disabled={approveMutation.isPending}
                className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => setRejectId(share.id)}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approveMutation.isPending]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Member Shares</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + Record Share Purchase
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600 dark:bg-gray-700 dark:text-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-500">{extractApiError(error)}</p>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Member Shares"
        showExportButton
      />

      {isLoading && (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      )}

      {/* Modals */}
      {showCreate && <CreateShareModal onClose={() => setShowCreate(false)} />}
      {rejectId && (
        <RejectModal shareId={rejectId} onClose={() => setRejectId(null)} />
      )}
    </div>
  );
}
