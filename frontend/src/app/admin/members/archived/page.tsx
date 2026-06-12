"use client";

import React, { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import ApprovalStatusBadge from "@/components/Members/ApprovalStatusBadge";
import { Member, useArchivedMembers, useRestoreMember } from "@/lib/api/members";
import { extractApiError } from "@/lib/api";

export default function ArchivedMembersPage() {
  const { data, isLoading, error } = useArchivedMembers({ per_page: 100 });
  const restoreMutation = useRestoreMember();

  const handleRestore = useCallback(async (member: Member) => {
    if (!window.confirm(`Restore ${member.full_name}?`)) return;
    try {
      await restoreMutation.mutateAsync(member.id);
      toast.success("Member restored.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }, [restoreMutation.mutateAsync]);

  const columns = useMemo<ColumnDef<Member>[]>(() => [
    { accessorKey: "member_number", header: "Member #" },
    { accessorKey: "full_name",     header: "Full Name" },
    { accessorKey: "phone",         header: "Phone" },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => (
        <ApprovalStatusBadge status={getValue<Member["approval_status"]>()} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => handleRestore(row.original)}
          disabled={restoreMutation.isPending}
          className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      ),
    },
  ], [handleRestore, restoreMutation.isPending]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Archived Members</h1>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}
      <DataTable columns={columns} data={data?.data ?? []} heading="Archived Members" />
    </div>
  );
}
