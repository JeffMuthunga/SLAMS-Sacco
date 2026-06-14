"use client";

import { useMyDividends, type DividendEntry } from "@/lib/api/dividends";
import DataTable from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(
    Number(v)
  );

type RunWithFY = DividendEntry & {
  dividend_run?: { fiscal_year?: { fiscal_year?: string } };
};

export default function MemberDividendsPage() {
  const { data: entries = [], isLoading } = useMyDividends();

  const columns: ColumnDef<DividendEntry>[] = [
    {
      id: "fiscal_year",
      header: "Fiscal Year",
      cell: ({ row }) =>
        (row.original as RunWithFY).dividend_run?.fiscal_year?.fiscal_year ?? "—",
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
      header: "Credited",
      cell: ({ row }) =>
        row.original.posted_at
          ? new Date(row.original.posted_at).toLocaleDateString("en-BW")
          : "Pending",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Dividends</h1>
      <DataTable columns={columns} data={entries} isLoading={isLoading} />
    </div>
  );
}
