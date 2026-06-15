"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { AuditLogEntry, AuditLogsParams, useAuditLogs } from "@/lib/api/audit-logs";

const EVENT_GROUPS = [
  { label: "All Events", value: "" },
  { label: "Members",    value: "member." },
  { label: "Loans",      value: "loan." },
  { label: "Petty Cash", value: "petty_cash." },
];

const EVENT_LABELS: Record<string, string> = {
  "member.applied":                    "Member Applied",
  "member.approved":                   "Member Approved",
  "member.rejected":                   "Member Rejected",
  "loan.applied":                      "Loan Applied",
  "loan.approved":                     "Loan Approved",
  "loan.rejected":                     "Loan Rejected",
  "loan.disbursed":                    "Loan Disbursed",
  "loan.repayment":                    "Loan Repayment",
  "loan.defaulted":                    "Loan Defaulted",
  "petty_cash.allocation.approved":    "Petty Cash Allocation Approved",
  "petty_cash.allocation.rejected":    "Petty Cash Allocation Rejected",
  "petty_cash.request.approved":       "Petty Cash Request Approved",
  "petty_cash.request.rejected":       "Petty Cash Request Rejected",
};

const EVENT_BADGE: Record<string, string> = {
  "member.applied":                 "bg-blue-100 text-blue-700",
  "member.approved":                "bg-green-100 text-green-700",
  "member.rejected":                "bg-red-100 text-red-700",
  "loan.applied":                   "bg-blue-100 text-blue-700",
  "loan.approved":                  "bg-green-100 text-green-700",
  "loan.rejected":                  "bg-red-100 text-red-700",
  "loan.disbursed":                 "bg-purple-100 text-purple-700",
  "loan.repayment":                 "bg-teal-100 text-teal-700",
  "loan.defaulted":                 "bg-red-100 text-red-700",
  "petty_cash.allocation.approved": "bg-green-100 text-green-700",
  "petty_cash.allocation.rejected": "bg-red-100 text-red-700",
  "petty_cash.request.approved":    "bg-green-100 text-green-700",
  "petty_cash.request.rejected":    "bg-red-100 text-red-700",
};

function EventBadge({ event }: { event: string }) {
  const label = EVENT_LABELS[event] ?? event;
  const cls   = EVENT_BADGE[event] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

const INPUT = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white";

export default function AuditLogsPage() {
  const [eventGroup, setEventGroup] = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [search,     setSearch]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 350);
  };

  const params: AuditLogsParams = {
    page,
    per_page: 50,
    ...(eventGroup       && { event:     eventGroup }),
    ...(dateFrom         && { date_from: dateFrom }),
    ...(dateTo           && { date_to:   dateTo }),
    ...(debouncedSearch  && { search:    debouncedSearch }),
  };

  const { data, isLoading } = useAuditLogs(params);
  const logs = data?.data ?? [];
  const meta = data?.meta;

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(() => [
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-xs text-gray-500">
          {new Date(getValue<string>()).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "event",
      header: "Event",
      cell: ({ getValue }) => <EventBadge event={getValue<string>()} />,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => (
        <span className="text-sm text-dark dark:text-white">{getValue<string>()}</span>
      ),
    },
    {
      id: "user",
      header: "Performed By",
      cell: ({ row }) => {
        const u = row.original.user;
        return u ? (
          <div className="text-sm">
            <p className="font-medium text-dark dark:text-white">{u.name}</p>
            <p className="text-xs text-gray-400">{u.email}</p>
          </div>
        ) : (
          <span className="text-xs text-gray-400">System</span>
        );
      },
    },
    {
      accessorKey: "subject_type",
      header: "Entity",
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? <span className="text-xs text-gray-500">{v}</span> : null;
      },
    },
    {
      accessorKey: "ip_address",
      header: "IP",
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-400">{getValue<string>() ?? "—"}</span>
      ),
    },
  ], []);

  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Audit Logs</h1>
        {meta && (
          <span className="text-sm text-gray-500">
            {meta.total.toLocaleString()} record{meta.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Event Type</label>
          <select
            value={eventGroup}
            onChange={(e) => { setEventGroup(e.target.value); setPage(1); }}
            className={INPUT}
          >
            {EVENT_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className={INPUT}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className={INPUT}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Search</label>
          <input
            type="text"
            placeholder="Search description…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className={`${INPUT} w-60`}
          />
        </div>

        <button
          onClick={() => {
            setEventGroup(""); setDateFrom(""); setDateTo("");
            setSearch(""); setDebouncedSearch(""); setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-dark-3 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-dark-3 dark:bg-gray-dark">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">No audit log entries found.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={logs} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-dark-3"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-dark-3"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
