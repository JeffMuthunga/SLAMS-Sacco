"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { DepositAccount, useAccounts } from "@/lib/api/accounts";
import { extractApiError } from "@/lib/api";

const STATUS_OPTIONS = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Draft",    value: "draft" },
];

function formatBalance(value: string): string {
  return parseFloat(value).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AccountsTable() {
  const [search, setSearch]               = useState("");
  const [status, setStatus]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, error } = useAccounts({
    search: debouncedSearch || undefined,
    status: status || undefined,
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

  const columns = useMemo<ColumnDef<DepositAccount>[]>(() => [
    {
      accessorKey: "account_number",
      header: "Account #",
      enableSorting: true,
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
      id: "product",
      header: "Product",
      cell: ({ row }) => row.original.product?.name ?? "—",
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ getValue }) => (
        <span className="font-mono text-right block">
          {formatBalance(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => (
        <AccountStatusBadge status={getValue<string>()} />
      ),
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ getValue }) => {
        const active = getValue<boolean>();
        return (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {active ? "Yes" : "No"}
          </span>
        );
      },
    },
    {
      accessorKey: "opening_date",
      header: "Opened",
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
          href={`/admin/accounts/${row.original.id}`}
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
          placeholder="Search account number…"
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

      {error && (
        <p className="text-sm text-red-500">{extractApiError(error)}</p>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Deposit Accounts"
        showExportButton
      />

      {isLoading && (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      )}
    </div>
  );
}
