// frontend/src/components/Members/MembersTable.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import ApprovalStatusBadge from "./ApprovalStatusBadge";
import { Member, useMembers, useDeleteMember } from "@/lib/api/members";
import { extractApiError } from "@/lib/api";

const STATUS_OPTIONS = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Draft",    value: "draft" },
];

export default function MembersTable() {
  const [search, setSearch]             = useState("");
  const [status, setStatus]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TODO: switch to server-side pagination when member count grows (ApiMeta has total/last_page)
  const { data, isLoading, error } = useMembers({
    search: debouncedSearch || undefined,
    status: status || undefined,
    per_page: 100,
  });

  const deleteMutation = useDeleteMember();

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const handleArchive = useCallback(async (member: Member) => {
    if (!window.confirm(`Archive ${member.full_name}?`)) return;
    try {
      await deleteMutation.mutateAsync(member.id);
      toast.success("Member archived.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }, [deleteMutation]);

  const columns = useMemo<ColumnDef<Member>[]>(() => [
    {
      accessorKey: "member_number",
      header: "Member #",
      enableSorting: true,
    },
    {
      accessorKey: "full_name",
      header: "Full Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "entry_date",
      header: "Entry Date",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? new Date(v).toLocaleDateString("en-BW") : "—";
      },
    },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => (
        <ApprovalStatusBadge status={getValue<Member["approval_status"]>()} />
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/members/${m.id}`}
              className="rounded px-2 py-1 text-xs font-medium text-primary hover:underline"
            >
              View
            </Link>
            <Link
              href={`/admin/members/${m.id}/edit`}
              className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:underline"
            >
              Edit
            </Link>
            <button
              onClick={() => handleArchive(m)}
              className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:underline"
            >
              Archive
            </button>
          </div>
        );
      },
    },
  ], [handleArchive]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name, member #, ID…"
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
        heading="Members"
        showExportButton
      />

      {isLoading && (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      )}
    </div>
  );
}
