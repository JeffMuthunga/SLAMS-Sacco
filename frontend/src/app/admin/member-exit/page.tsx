"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SelectInput from "@/components/Forms/SelectInput";
import DateInput from "@/components/Forms/DateInput";
import {
  useMemberExits,
  useCreateMemberExit,
  useApproveMemberExit,
  useRejectMemberExit,
  type MemberExit,
  type ExitStatus,
  type CreateMemberExitPayload,
} from "@/lib/api/member-exit";
import { useMembers } from "@/lib/api/members";
import { extractApiError } from "@/lib/api";

type Tab = "pending" | "approved" | "rejected";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const EXIT_TYPE_OPTIONS = [
  { value: "voluntary", label: "Voluntary" },
  { value: "death", label: "Death" },
  { value: "expulsion", label: "Expulsion" },
  { value: "transfer", label: "Transfer" },
  { value: "medical", label: "Medical Boarding" },
];

const STATUS_COLOURS: Record<ExitStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: ExitStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOURS[status]}`}
    >
      {status}
    </span>
  );
}

// ── Create Dialog ──────────────────────────────────────────────────────

function CreateExitDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: membersData } = useMembers({ per_page: 500 });
  const createExit = useCreateMemberExit();
  const [form, setForm] = useState<CreateMemberExitPayload>({
    member_id: "",
    exit_type: "voluntary",
    exit_date: "",
    reason: "",
    notes: "",
  });

  // useMembers returns { data: Member[], meta: ApiMeta }
  const memberOptions = (membersData?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.full_name} (${m.member_number})`,
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.member_id || !form.exit_date) {
      toast.error("Member and exit date are required.");
      return;
    }
    createExit.mutate(
      {
        member_id: form.member_id,
        exit_type: form.exit_type,
        exit_date: form.exit_date,
        reason: form.reason || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Exit request created.");
          onClose();
          setForm({
            member_id: "",
            exit_type: "voluntary",
            exit_date: "",
            reason: "",
            notes: "",
          });
        },
        onError: (err: Error) =>
          toast.error(extractApiError(err)),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Exit Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member <span className="text-red-500">*</span>
            </label>
            <SelectInput
              options={memberOptions}
              value={memberOptions.find((o) => o.value === form.member_id) ?? null}
              onChange={(opt) =>
                setForm((p) => ({
                  ...p,
                  member_id:
                    (opt as { value: string } | null)?.value ?? "",
                }))
              }
              placeholder="Select member..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Type <span className="text-red-500">*</span>
            </label>
            <SelectInput
              options={EXIT_TYPE_OPTIONS}
              value={EXIT_TYPE_OPTIONS.find((o) => o.value === form.exit_type) ?? null}
              onChange={(opt) =>
                setForm((p) => ({
                  ...p,
                  exit_type:
                    (
                      (opt as { value: string } | null)?.value ?? "voluntary"
                    ) as CreateMemberExitPayload["exit_type"],
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Exit Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={form.exit_date}
              onChange={(v) => setForm((p) => ({ ...p, exit_date: v }))}
              placeholder="Select date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              value={form.reason}
              onChange={(e) =>
                setForm((p) => ({ ...p, reason: e.target.value }))
              }
              placeholder="Reason for exit..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Internal notes..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExit.isPending}>
              {createExit.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject Dialog ──────────────────────────────────────────────────────

function RejectDialog({
  exitId,
  onClose,
}: {
  exitId: string | null;
  onClose: () => void;
}) {
  const rejectExit = useRejectMemberExit();
  const [reason, setReason] = useState("");

  function handleReject() {
    if (!exitId || !reason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    rejectExit.mutate(
      { id: exitId, rejection_reason: reason },
      {
        onSuccess: () => {
          toast.success("Exit request rejected.");
          onClose();
          setReason("");
        },
        onError: (err: Error) =>
          toast.error(extractApiError(err)),
      }
    );
  }

  return (
    <Dialog open={!!exitId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Exit Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this exit request.
          </p>
          <textarea
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Rejection reason..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectExit.isPending}
          >
            {rejectExit.isPending ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function MemberExitPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const approveExit = useApproveMemberExit();

  const { data } = useMemberExits({ status: tab, per_page: 200 });
  const exits = data?.data ?? [];

  function handleApprove(id: string) {
    approveExit.mutate(id, {
      onSuccess: () =>
        toast.success("Exit request approved. Member deactivated."),
      onError: (err: Error) =>
        toast.error(extractApiError(err)),
    });
  }

  const columns = useMemo<ColumnDef<MemberExit>[]>(() => {
    const base: ColumnDef<MemberExit>[] = [
      {
        accessorKey: "reference_number",
        header: "Reference",
        enableSorting: true,
      },
      {
        id: "member_name",
        header: "Member",
        accessorFn: (row) => row.member?.full_name ?? "—",
      },
      {
        id: "member_number",
        header: "Member #",
        accessorFn: (row) => row.member?.member_number ?? "—",
      },
      {
        accessorKey: "exit_type",
        header: "Type",
        cell: ({ getValue }) => (
          <span className="capitalize">{getValue<string>()}</span>
        ),
      },
      { accessorKey: "exit_date", header: "Exit Date" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<ExitStatus>()} />
        ),
      },
      {
        id: "requested_by",
        header: "Requested By",
        accessorFn: (row) => row.requested_by?.name ?? "—",
      },
      {
        id: "requested_at",
        header: "Requested",
        accessorFn: (row) =>
          row.requested_at
            ? new Date(row.requested_at).toLocaleDateString("en-KE")
            : "—",
      },
    ];

    if (tab === "pending") {
      base.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => handleApprove(row.original.id)}
              disabled={approveExit.isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-400 text-red-600 hover:bg-red-50"
              onClick={() => setRejectId(row.original.id)}
            >
              Reject
            </Button>
          </div>
        ),
      });
    }

    if (tab === "rejected") {
      base.push({
        accessorKey: "rejection_reason",
        header: "Rejection Reason",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-500">
            {getValue<string>() ?? "—"}
          </span>
        ),
      });
    }

    return base;
  }, [tab, approveExit.isPending]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            Member Exit
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage member exit requests
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ New Exit Request</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={exits}
        heading={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Exit Requests`}
      />

      <CreateExitDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <RejectDialog exitId={rejectId} onClose={() => setRejectId(null)} />
    </div>
  );
}
