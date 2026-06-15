"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { CommodityRequest, useCommodityRequests } from "@/lib/api/commodities";
import { extractApiError } from "@/lib/api";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Issued", value: "issued" },
  { label: "Repaid", value: "repaid" },
  { label: "Rejected", value: "rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    issued: "bg-indigo-100 text-indigo-800",
    repaid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminCommodityRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useCommodityRequests({
    status: statusFilter || undefined,
    per_page: 50,
  });

  const columns = useMemo<ColumnDef<CommodityRequest>[]>(() => [
    {
      accessorKey: "request_number",
      header: "Req #",
      cell: ({ getValue }) => <span className="font-mono">{getValue<string>()}</span>,
    },
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => {
        const m = row.original.member;
        return m ? `${m.full_name} (${m.member_number})` : "—";
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ getValue }) => <span className="font-mono">{parseFloat(getValue<string>()).toLocaleString("en-BW", { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link href={`/admin/commodity-requests/${row.original.id}`} className="text-xs font-medium text-primary hover:underline">
          View & Process
        </Link>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Commodity Requests</h1>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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
        heading="Requests"
        showExportButton
      />
    </div>
  );
}
