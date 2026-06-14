"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  ShareProduct,
  useShareProducts,
  useCreateShareProduct,
  useUpdateShareProduct,
  useDeleteShareProduct,
} from "@/lib/api/shares";
import { useChartOfAccounts } from "@/lib/api/journals";
import { RequireAbility } from "@/lib/AbilityContext";

export default function ShareProductsPage() {
  const { data: shareProducts, isLoading, error } = useShareProducts();
  const { data: accounts = [] } = useChartOfAccounts({ active_only: true });

  const createMutation = useCreateShareProduct();
  const updateMutation = useUpdateShareProduct();
  const deleteMutation = useDeleteShareProduct();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [minShares, setMinShares] = useState("1");
  const [maxShares, setMaxShares] = useState("");
  const [shareCapitalAccountId, setShareCapitalAccountId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setPricePerShare("");
    setMinShares("1");
    setMaxShares("");
    setShareCapitalAccountId("");
    setIsActive(true);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (sp: ShareProduct) => {
    setEditingId(sp.id);
    setName(sp.name);
    setPricePerShare(sp.price_per_share);
    setMinShares(String(sp.min_shares));
    setMaxShares(sp.max_shares !== null ? String(sp.max_shares) : "");
    setShareCapitalAccountId(sp.share_capital_account_id ?? "");
    setIsActive(sp.is_active);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this share product?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Share product deleted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedMinShares = parseInt(minShares, 10);
    const parsedMaxShares = maxShares.trim() ? parseInt(maxShares, 10) : null;
    const parsedPrice = parseFloat(pricePerShare);

    if (!name.trim()) return toast.error("Name is required.");
    if (isNaN(parsedPrice) || parsedPrice <= 0) return toast.error("Price per share must be greater than 0.");
    if (isNaN(parsedMinShares) || parsedMinShares < 1) return toast.error("Minimum shares must be at least 1.");

    const payload = {
      name: name.trim(),
      price_per_share: parsedPrice.toFixed(2),
      min_shares: parsedMinShares,
      max_shares: parsedMaxShares,
      share_capital_account_id: shareCapitalAccountId || null,
      is_active: isActive,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast.success("Share product updated.");
            resetForm();
          },
          onError: (err) => toast.error(extractApiError(err)),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Share product created.");
          resetForm();
        },
        onError: (err) => toast.error(extractApiError(err)),
      });
    }
  };

  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const acc of accounts) {
      map[acc.id] = `${acc.code} — ${acc.name}`;
    }
    return map;
  }, [accounts]);

  const columns = useMemo<ColumnDef<ShareProduct>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "price_per_share",
        header: "Price per Share (BWP)",
        cell: ({ getValue }) => (
          <span className="font-mono">
            BWP{" "}
            {parseFloat(getValue<string>()).toLocaleString("en-BW", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        id: "shares_range",
        header: "Min / Max Shares",
        cell: ({ row }) => {
          const { min_shares, max_shares } = row.original;
          return (
            <span className="font-mono">
              {min_shares.toLocaleString()} / {max_shares !== null ? max_shares.toLocaleString() : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ getValue }) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              getValue<boolean>()
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {getValue<boolean>() ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        id: "share_capital_account",
        header: "Share Capital Account",
        cell: ({ row }) => {
          const accountId = row.original.share_capital_account_id;
          if (!accountId) return <span className="text-gray-400">—</span>;
          return <span>{accountMap[accountId] ?? accountId}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <RequireAbility action="manage_configurations">
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(row.original)}
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
    ],
    [accountMap] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Share Products
        </h1>
        <RequireAbility action="manage_configurations">
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            + Add Share Product
          </button>
        </RequireAbility>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-dark"
        >
          <h2 className="mb-4 text-lg font-medium">
            {editingId ? "Edit Share Product" : "Create Share Product"}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name *
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ordinary Shares"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price per Share (BWP) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Minimum Shares *
              </label>
              <input
                required
                type="number"
                min="1"
                value={minShares}
                onChange={(e) => setMinShares(e.target.value)}
                placeholder="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maximum Shares
                <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={maxShares}
                onChange={(e) => setMaxShares(e.target.value)}
                placeholder="No limit"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Share Capital Account
                <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              <select
                value={shareCapitalAccountId}
                onChange={(e) => setShareCapitalAccountId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">None</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} — {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-60"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving…"
                : "Save"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}
      {isLoading && (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      )}

      {!isFormOpen && (
        <DataTable
          columns={columns}
          data={shareProducts ?? []}
          heading="Share Products"
          showExportButton
        />
      )}
    </div>
  );
}
