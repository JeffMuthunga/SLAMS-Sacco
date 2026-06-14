"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { LoanStatusBadge } from "./LoanStatusBadge";
import { Loan, useLoans } from "@/lib/api/loans";
import { extractApiError } from "@/lib/api";

const STATUS_OPTIONS = [
  { label: "All",       value: "" },
  { label: "Applied",   value: "applied" },
  { label: "Approved",  value: "approved" },
  { label: "Active",    value: "active" },
  { label: "Repaid",    value: "repaid" },
  { label: "Rejected",  value: "rejected" },
  { label: "Defaulted", value: "defaulted" },
  { label: "Draft",     value: "draft" },
];

function fmt(v: string) {
  return parseFloat(v).toLocaleString("en-BW", { minimumFractionDigits: 2 });
}

interface Props {
  defaultStatus?: string;
}

export default function LoansTable({ defaultStatus = "" }: Props) {
  const [search, setSearch]               = useState("");
  const [status, setStatus]               = useState(defaultStatus);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, error } = useLoans({
    search: debouncedSearch || undefined,
    loan_status: status || undefined,
    per_page: 100,
  });

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const columns = useMemo<ColumnDef<Loan>[]>(() => [
    { accessorKey: "account_number", header: "Loan #", enableSorting: true },
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => {
        const m = row.original.member;
        return m ? `${m.full_name} (${m.member_number})` : "—";
      },
    },
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => row.original.loan_product?.name ?? "—",
    },
    {
      accessorKey: "principal_amount",
      header: "Principal",
      cell: ({ getValue }) => (
        <span className="font-mono">{fmt(getValue<string>())}</span>
      ),
    },
    {
      accessorKey: "outstanding_balance",
      header: "Outstanding",
      cell: ({ getValue }) => (
        <span className="font-mono">{fmt(getValue<string>())}</span>
      ),
    },
    {
      accessorKey: "loan_status",
      header: "Status",
      cell: ({ getValue }) => <LoanStatusBadge status={getValue<string>()} />,
    },
    {
      accessorKey: "applied_at",
      header: "Applied",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? new Date(v).toLocaleDateString("en-BW") : "—";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link
          href={`/admin/loans/${row.original.id}`}
          className="rounded px-2 py-1 text-xs font-medium text-primary hover:underline"
        >
          View
        </Link>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search loan #, member…"
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

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Loans"
        showExportButton
      />

      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}
