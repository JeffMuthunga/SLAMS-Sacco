"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { Issue, IssuePriority, IssueStatus, useIssueCategories, useIssues } from "@/lib/api/issues";
import { extractApiError } from "@/lib/api";

const PRIORITY_CFG: Record<IssuePriority, { label: string; className: string }> = {
  low:    { label: "Low",    className: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700" },
  high:   { label: "High",   className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

const STATUS_CFG: Record<IssueStatus, { label: string; className: string }> = {
  open:        { label: "Open",        className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-700" },
  resolved:    { label: "Resolved",    className: "bg-green-100 text-green-700" },
  closed:      { label: "Closed",      className: "bg-gray-100 text-gray-600" },
};

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CFG[priority as IssuePriority] ?? { label: priority, className: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as IssueStatus] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}

const STATUS_OPTIONS = ["", "open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["", "urgent", "high", "medium", "low"];

export default function IssuesPage() {
  const [search, setSearch]               = useState("");
  const [status, setStatus]               = useState("");
  const [priority, setPriority]           = useState("");
  const [categoryId, setCategoryId]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: categories = [] } = useIssueCategories();

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const { data, isLoading, error } = useIssues({
    search: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    category_id: categoryId || undefined,
    per_page: 100,
  });

  const columns = useMemo<ColumnDef<Issue>[]>(() => [
    { accessorKey: "reference_number", header: "Reference", enableSorting: true },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ getValue }) => <PriorityBadge priority={getValue<string>()} />,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v.length > 55 ? v.slice(0, 55) + "…" : v;
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name ?? "—",
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
      id: "assignee",
      header: "Assigned To",
      cell: ({ row }) => row.original.assignee?.name ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      accessorKey: "created_at",
      header: "Opened",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-BW"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link
          href={`/admin/issues/${row.original.id}`}
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
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Issue Tracking</h1>
        <Link
          href="/admin/issues/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + New Issue
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search reference, title…"
          value={search}
          onChange={handleSearchChange}
          className="w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? STATUS_CFG[s as IssueStatus].label : "All Statuses"}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p ? PRIORITY_CFG[p as IssuePriority].label : "All Priorities"}</option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Issues"
        showExportButton
      />
    </div>
  );
}
