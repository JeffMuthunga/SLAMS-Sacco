"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  Commodity,
  useCommodities,
  useCommodityTypes,
  useCreateCommodity,
  useUpdateCommodity,
  useDeleteCommodity,
} from "@/lib/api/commodities";
import { RequireAbility } from "@/lib/AbilityContext";

export default function CommoditiesPage() {
  const { data: commodities, isLoading, error } = useCommodities();
  const { data: types } = useCommodityTypes();

  const createMutation = useCreateCommodity();
  const updateMutation = useUpdateCommodity();
  const deleteMutation = useDeleteCommodity();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setTypeId("");
    setUnitPrice("");
    setStockQuantity("0");
    setIsActive(true);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (c: Commodity) => {
    setEditingId(c.id);
    setName(c.name);
    setTypeId(c.commodity_type_id);
    setUnitPrice(c.unit_price);
    setStockQuantity(String(c.stock_quantity));
    setIsActive(c.is_active);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this commodity?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Commodity deleted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId) return toast.error("Please select a commodity type.");

    const payload = {
      commodity_type_id: typeId,
      name,
      unit_price: unitPrice,
      stock_quantity: parseInt(stockQuantity, 10),
      is_active: isActive,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast.success("Commodity updated.");
            resetForm();
          },
          onError: (err) => toast.error(extractApiError(err)),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Commodity created.");
          resetForm();
        },
        onError: (err) => toast.error(extractApiError(err)),
      });
    }
  };

  const columns = useMemo<ColumnDef<Commodity>[]>(() => [
    {
      id: "type",
      header: "Category",
      cell: ({ row }) => row.original.commodity_type?.name ?? "—",
    },
    {
      accessorKey: "name",
      header: "Item Name",
    },
    {
      accessorKey: "unit_price",
      header: "Unit Price",
      cell: ({ getValue }) => <span className="font-mono">{parseFloat(getValue<string>()).toLocaleString("en-BW", { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: "stock_quantity",
      header: "Stock",
      cell: ({ getValue }) => {
        const qty = getValue<number>();
        return <span className={`font-mono ${qty < 10 ? "text-red-600 font-bold" : ""}`}>{qty}</span>;
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ getValue }) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getValue<boolean>() ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
          {getValue<boolean>() ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <RequireAbility action="manage_configurations">
          <div className="flex gap-2">
            <button onClick={() => handleEdit(row.original)} className="text-xs text-primary hover:underline">
              Edit
            </button>
            <button onClick={() => handleDelete(row.original.id)} className="text-xs text-red-600 hover:underline">
              Delete
            </button>
          </div>
        </RequireAbility>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Commodities Inventory</h1>
        <RequireAbility action="manage_configurations">
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            + New Commodity
          </button>
        </RequireAbility>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-medium">{editingId ? "Edit Commodity" : "Create Commodity"}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
              <select required value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                <option value="">Select Category...</option>
                {types?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Price *</label>
              <input required type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Quantity</label>
              <input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
                Active (Available for request)
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90">
              Save
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}

      {!isFormOpen && (
        <DataTable columns={columns} data={commodities ?? []} heading="Commodities" showExportButton />
      )}
    </div>
  );
}
