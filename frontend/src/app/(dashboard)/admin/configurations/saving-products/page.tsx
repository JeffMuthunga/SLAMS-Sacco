"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSavingProducts,
  useCreateSavingProduct,
  useUpdateSavingProduct,
  useDeleteSavingProduct,
  type SavingProduct,
  type CreateSavingProductPayload,
} from "@/lib/api/configurations";

type FormState = {
  name: string;
  description: string;
  interest_rate: string;
  min_opening_balance: string;
  min_balance: string;
  max_balance: string;
  min_deposit: string;
  max_deposit: string;
  min_withdrawal: string;
  max_withdrawal: string;
  lock_in_months: string;
  withdrawal_frequency: "any" | "daily" | "weekly" | "monthly";
  is_active: boolean;
};

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  interest_rate: "0",
  min_opening_balance: "0",
  min_balance: "0",
  max_balance: "",
  min_deposit: "0",
  max_deposit: "",
  min_withdrawal: "0",
  max_withdrawal: "",
  lock_in_months: "0",
  withdrawal_frequency: "any",
  is_active: true,
};

function SavingProductForm({
  form,
  onChange,
  editingId,
  onSubmit,
  onCancel,
  isPending,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-4">
        {editingId ? "Edit Saving Product" : "New Saving Product"}
      </h3>
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Row 1: Name — full width */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Regular Savings"
            />
          </div>

          {/* Row 2: Description — full width */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          {/* Row 3: Interest Rate %, Withdrawal Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate %
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.interest_rate}
              onChange={(e) => onChange({ interest_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Withdrawal Frequency
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.withdrawal_frequency}
              onChange={(e) =>
                onChange({
                  withdrawal_frequency: e.target.value as
                    | "any"
                    | "daily"
                    | "weekly"
                    | "monthly",
                })
              }
            >
              <option value="any">Any Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Row 4: Min Opening Balance, Min Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Opening Balance
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.min_opening_balance}
              onChange={(e) =>
                onChange({ min_opening_balance: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Balance
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.min_balance}
              onChange={(e) => onChange({ min_balance: e.target.value })}
            />
          </div>

          {/* Row 5: Max Balance (optional), Min Deposit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Balance (optional)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.max_balance}
              onChange={(e) => onChange({ max_balance: e.target.value })}
              placeholder="Leave blank for no limit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Deposit
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.min_deposit}
              onChange={(e) => onChange({ min_deposit: e.target.value })}
            />
          </div>

          {/* Row 6: Max Deposit (optional), Min Withdrawal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Deposit (optional)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.max_deposit}
              onChange={(e) => onChange({ max_deposit: e.target.value })}
              placeholder="Leave blank for no limit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Withdrawal
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.min_withdrawal}
              onChange={(e) => onChange({ min_withdrawal: e.target.value })}
            />
          </div>

          {/* Row 7: Max Withdrawal (optional), Lock-in Months */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Withdrawal (optional)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.max_withdrawal}
              onChange={(e) => onChange({ max_withdrawal: e.target.value })}
              placeholder="Leave blank for no limit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lock-in Months
            </label>
            <Input
              type="number"
              step="1"
              min="0"
              value={form.lock_in_months}
              onChange={(e) => onChange({ lock_in_months: e.target.value })}
            />
          </div>

          {/* Row 8: Is Active */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => onChange({ is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              Is Active
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-x-3 justify-end">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
      Inactive
    </span>
  );
}

function WithdrawalFrequencyLabel({
  freq,
}: {
  freq: SavingProduct["withdrawal_frequency"];
}) {
  const labels: Record<SavingProduct["withdrawal_frequency"], string> = {
    any: "Any Time",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };
  return <>{labels[freq]}</>;
}

export default function SavingProductsPage() {
  const { data: products, isLoading } = useSavingProducts();
  const createSavingProduct = useCreateSavingProduct();
  const deleteSavingProduct = useDeleteSavingProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });

  const updateSavingProduct = useUpdateSavingProduct(editingId ?? "");

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function resetForm() {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(product: SavingProduct) {
    setForm({
      name: product.name,
      description: product.description ?? "",
      interest_rate: product.interest_rate,
      min_opening_balance: product.min_opening_balance,
      min_balance: product.min_balance,
      max_balance: product.max_balance ?? "",
      min_deposit: product.min_deposit,
      max_deposit: product.max_deposit ?? "",
      min_withdrawal: product.min_withdrawal,
      max_withdrawal: product.max_withdrawal ?? "",
      lock_in_months: String(product.lock_in_months),
      withdrawal_frequency: product.withdrawal_frequency,
      is_active: product.is_active,
    });
    setEditingId(product.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: CreateSavingProductPayload = {
      name: form.name,
      description: form.description || null,
      interest_rate: form.interest_rate,
      min_opening_balance: form.min_opening_balance,
      min_balance: form.min_balance,
      max_balance: form.max_balance === "" ? null : form.max_balance,
      min_deposit: form.min_deposit,
      max_deposit: form.max_deposit === "" ? null : form.max_deposit,
      min_withdrawal: form.min_withdrawal,
      max_withdrawal: form.max_withdrawal === "" ? null : form.max_withdrawal,
      lock_in_months: parseInt(form.lock_in_months, 10),
      withdrawal_frequency: form.withdrawal_frequency,
      is_active: form.is_active,
    };

    if (editingId) {
      updateSavingProduct.mutate(payload, {
        onSuccess: () => {
          toast.success("Saving product updated.");
          resetForm();
        },
        onError: (err) =>
          toast.error(err.message ?? "Failed to update saving product."),
      });
    } else {
      createSavingProduct.mutate(payload, {
        onSuccess: () => {
          toast.success("Saving product created.");
          resetForm();
        },
        onError: (err) =>
          toast.error(err.message ?? "Failed to create saving product."),
      });
    }
  }

  function handleDelete(product: SavingProduct) {
    if (
      !confirm(
        `Archive "${product.name}"? This will soft-delete the saving product.`,
      )
    )
      return;
    deleteSavingProduct.mutate(product.id, {
      onSuccess: () => toast.success("Saving product archived."),
      onError: (err) =>
        toast.error(err.message ?? "Failed to archive saving product."),
    });
  }

  const isPending =
    createSavingProduct.isPending || updateSavingProduct.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Saving Products
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Define saving account products offered to members.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              setForm({ ...INITIAL_FORM });
              setEditingId(null);
              setShowForm(true);
            }}
          >
            Add Saving Product
          </Button>
        )}
      </div>

      {showForm && (
        <SavingProductForm
          form={form}
          onChange={patchForm}
          editingId={editingId}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isPending={isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">
                  Name
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                  Interest Rate
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                  Withdrawal Frequency
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                  Status
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {!products || products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-gray-500"
                  >
                    No saving products yet. Add one above.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {product.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {parseFloat(product.interest_rate).toFixed(2)}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <WithdrawalFrequencyLabel
                        freq={product.withdrawal_frequency}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <ActiveBadge active={product.is_active} />
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
