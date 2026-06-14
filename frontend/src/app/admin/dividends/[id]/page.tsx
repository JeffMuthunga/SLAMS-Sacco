"use client";

import { use } from "react";
import { toast } from "sonner";
import {
  useDividendRun,
  useApproveDividendRun,
  usePostDividendRun,
  type DividendEntry,
} from "@/lib/api/dividends";
import { extractApiError } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(
    Number(v)
  );

export default function DividendRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: run, isLoading } = useDividendRun(id);
  const approveMut = useApproveDividendRun();
  const postMut = usePostDividendRun();

  async function handleApprove() {
    if (!confirm("Approve this dividend run?")) return;
    try {
      await approveMut.mutateAsync(id);
      toast.success("Dividend run approved.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  async function handlePost() {
    if (
      !confirm(
        "Post dividends? This will credit all member accounts and cannot be undone."
      )
    )
      return;
    try {
      await postMut.mutateAsync(id);
      toast.success("Dividends posted to member accounts.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const entries = run?.entries ?? [];

  const columns: ColumnDef<DividendEntry>[] = [
    {
      id: "member_number",
      header: "Member #",
      cell: ({ row }) => row.original.member?.member_number ?? "—",
    },
    {
      id: "full_name",
      header: "Name",
      cell: ({ row }) => row.original.member?.full_name ?? "—",
    },
    {
      accessorKey: "share_balance",
      header: "Share Balance",
      cell: ({ row }) => fmt(row.original.share_balance),
    },
    {
      accessorKey: "dividend_amount",
      header: "Dividend",
      cell: ({ row }) => fmt(row.original.dividend_amount),
    },
    {
      accessorKey: "posted_at",
      header: "Posted",
      cell: ({ row }) =>
        row.original.posted_at
          ? new Date(row.original.posted_at).toLocaleDateString("en-BW")
          : "—",
    },
  ];

  const STATUS_COLOR: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-700",
    approved: "bg-blue-100 text-blue-700",
    posted: "bg-green-100 text-green-700",
  };

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (!run) return <div className="p-6 text-red-500">Dividend run not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Dividend Run — {run.fiscal_year?.fiscal_year}
          </h1>
          <p className="text-gray-500 text-sm">
            Rate: {(Number(run.rate) * 100).toFixed(2)}%
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            STATUS_COLOR[run.status] ?? ""
          }`}
        >
          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total Dividend</p>
          <p className="text-xl font-bold">{fmt(run.total_dividend)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Members</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
        {run.approved_at && (
          <div className="rounded border p-4">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-sm font-medium">
              {new Date(run.approved_at).toLocaleDateString("en-BW")}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {run.status === "draft" && (
          <Button onClick={handleApprove} disabled={approveMut.isPending}>
            Approve Run
          </Button>
        )}
        {run.status === "approved" && (
          <Button onClick={handlePost} disabled={postMut.isPending}>
            Post to Member Accounts
          </Button>
        )}
      </div>

      <h2 className="text-lg font-semibold">
        Per-Member Entries ({entries.length})
      </h2>
      <DataTable columns={columns} data={entries} />
    </div>
  );
}
