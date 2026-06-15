"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { CommodityRequest, usePortalCommodityRequests } from "@/lib/api/commodities";
import { extractApiError } from "@/lib/api";

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

export default function MemberCommodityRequestsPage() {
  const { data, isLoading, error } = usePortalCommodityRequests({ per_page: 50 });

  const columns = useMemo<ColumnDef<CommodityRequest>[]>(() => [
    {
      accessorKey: "request_number",
      header: "Req #",
      cell: ({ getValue }) => <span className="font-mono">{getValue<string>()}</span>,
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ getValue }) => <span className="font-mono">{parseFloat(getValue<string>()).toLocaleString("en-BW", { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      id: "items",
      header: "Items Requested",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-xs text-gray-500">
          {row.original.items.map(i => `${i.quantity}x ${i.commodity?.name}`).join(", ")}
        </div>
      )
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Commodity Requests</h1>
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Requests"
      />
    </div>
  );
}
