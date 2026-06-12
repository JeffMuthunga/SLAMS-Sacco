"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { Journal, useJournals } from "@/lib/api/journals";
import { extractApiError } from "@/lib/api";

const STATUS_OPTIONS = [
  { label: "All",      value: "" },
  { label: "Draft",    value: "false" },
  { label: "Posted",   value: "true" },
];

export default function JournalsPage() {
  const [search, setSearch]               = useState("");
  const [isPosted, setIsPosted]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const params = {
    search: debouncedSearch || undefined,
    is_posted: isPosted !== "" ? isPosted === "true" : undefined,
    per_page: 100,
  };

  const { data, isLoading, error } = useJournals(params);

  const columns = useMemo<ColumnDef<Journal>[]>(() => [
    { accessorKey: "reference_number", header: "Reference", enableSorting: true },
    {
      accessorKey: "journal_date",
      header: "Date",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-KE"),
    },
    {
      id: "period",
      header: "Period",
      cell: ({ row }) => row.original.period?.name ?? "—",
    },
    {
      accessorKey: "narration",
      header: "Narration",
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? (v.length > 60 ? v.slice(0, 60) + "…" : v) : "—";
      },
    },
    {
      accessorKey: "is_posted",
      header: "Status",
      cell: ({ row }) => {
        const j = row.original;
        if (j.is_reversed) {
          return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">Reversed</span>;
        }
        return j.is_posted ? (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Posted</span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Draft</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link
          href={`/admin/journals/${row.original.id}`}
          className="rounded px-2 py-1 text-xs font-medium text-primary hover:underline"
        >
          View
        </Link>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Journals</h1>
        <Link
          href="/admin/journals/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + New Journal Entry
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search reference, narration…"
          value={search}
          onChange={handleSearchChange}
          className="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
        />
        <select
          value={isPosted}
          onChange={(e) => setIsPosted(e.target.value)}
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
        heading="Journal Entries"
        showExportButton
      />

      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}
