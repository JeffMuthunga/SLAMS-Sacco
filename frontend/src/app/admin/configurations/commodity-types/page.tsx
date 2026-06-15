"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  CommodityType,
  useCommodityTypes,
  useCreateCommodityType,
  useUpdateCommodityType,
  useDeleteCommodityType,
} from "@/lib/api/commodities";
import { RequireAbility } from "@/lib/AbilityContext";

export default function CommodityTypesPage() {
  const { data, isLoading, error } = useCommodityTypes();

  const createMutation = useCreateCommodityType();
  const updateMutation = useUpdateCommodityType();
  const deleteMutation = useDeleteCommodityType();

  const [isEditing, setIsEditing] = useState<CommodityType | null>(null);

  const handleSave = (name: string) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: isEditing.id, name },
        {
          onSuccess: () => {
            toast.success("Commodity type updated.");
            setIsEditing(null);
          },
          onError: (err) => toast.error(extractApiError(err)),
        }
      );
    } else {
      createMutation.mutate(
        { name },
        {
          onSuccess: () => {
            toast.success("Commodity type created.");
            // We'd usually reset a form here, but we'll use window.prompt for a simple UX on config pages,
            // or we can just keep it simple with an inline form. Let's do prompt since it's a single string field.
          },
          onError: (err) => toast.error(extractApiError(err)),
        }
      );
    }
  };

  const handleCreatePrompt = () => {
    const name = window.prompt("Enter new commodity type name:");
    if (name?.trim()) handleSave(name.trim());
  };

  const handleEditPrompt = (ct: CommodityType) => {
    setIsEditing(ct);
    const name = window.prompt("Edit commodity type name:", ct.name);
    if (name !== null) {
      if (name.trim()) handleSave(name.trim());
      else setIsEditing(null);
    } else {
      setIsEditing(null);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this commodity type?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Commodity type deleted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const columns = useMemo<ColumnDef<CommodityType>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <RequireAbility action="manage_configurations">
          <div className="flex gap-2">
            <button
              onClick={() => handleEditPrompt(row.original)}
              className="text-xs text-primary hover:underline"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        </RequireAbility>
      ),
    },
  ], [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Commodity Types</h1>
        <RequireAbility action="manage_configurations">
          <button
            onClick={handleCreatePrompt}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            + New Type
          </button>
        </RequireAbility>
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}

      <DataTable
        columns={columns}
        data={data ?? []}
        heading="Commodity Types"
        showExportButton
      />
    </div>
  );
}
