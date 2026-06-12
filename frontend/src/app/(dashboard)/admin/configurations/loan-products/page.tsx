"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useLoanProducts,
  useCreateLoanProduct,
  useUpdateLoanProduct,
  useDeleteLoanProduct,
  type LoanProduct,
  type CreateLoanProductPayload,
} from "@/lib/api/configurations";

type FormState = {
  name: string;
  description: string;
  interest_rate: string;
  interest_method: "flat" | "reducing_balance";
  repayment_frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually";
  min_amount: string;
  max_amount: string;
  min_period_months: string;
  max_period_months: string;
  max_repayments: string;
  requires_guarantor: boolean;
  requires_collateral: boolean;
  min_membership_months: string;
  processing_fee_amount: string;
  processing_fee_percent: string;
  penalty_rate: string;
  is_active: boolean;
};

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  interest_rate: "0",
  interest_method: "reducing_balance",
  repayment_frequency: "monthly",
  min_amount: "0",
  max_amount: "0",
  min_period_months: "12",
  max_period_months: "12",
  max_repayments: "",
  requires_guarantor: true,
  requires_collateral: false,
  min_membership_months: "0",
  processing_fee_amount: "0",
  processing_fee_percent: "0",
  penalty_rate: "0",
  is_active: true,
};

function LoanProductForm({
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
        {editingId ? "Edit Loan Product" : "New Loan Product"}
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
              placeholder="e.g. Normal Loan"
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

          {/* Row 3: Interest Rate, Interest Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate %
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.interest_rate}
              onChange={(e) => onChange({ interest_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Method
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.interest_method}
              onChange={(e) => {
                const v = e.target.value as "flat" | "reducing_balance";
                onChange({ interest_method: v });
              }}
            >
              <option value="flat">Flat</option>
              <option value="reducing_balance">Reducing Balance</option>
            </select>
          </div>

          {/* Row 4: Repayment Frequency — full width */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repayment Frequency
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.repayment_frequency}
              onChange={(e) =>
                onChange({
                  repayment_frequency: e.target.value as
                    | "daily"
                    | "weekly"
                    | "monthly"
                    | "quarterly"
                    | "annually",
                })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          {/* Row 5: Min Amount, Max Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Amount
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.min_amount}
              onChange={(e) => onChange({ min_amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Amount
            </label>
            <Input
              type="number"
              step="0.01"
              value={form.max_amount}
              onChange={(e) => onChange({ max_amount: e.target.value })}
            />
          </div>

          {/* Row 6: Min Period, Max Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Period (months)
            </label>
            <Input
              type="number"
              step="1"
              min="1"
              value={form.min_period_months}
              onChange={(e) => onChange({ min_period_months: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Period (months)
            </label>
            <Input
              type="number"
              step="1"
              min="1"
              value={form.max_period_months}
              onChange={(e) => onChange({ max_period_months: e.target.value })}
            />
          </div>

          {/* Row 7: Checkboxes */}
          <div className="sm:col-span-2 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requires_guarantor}
                onChange={(e) =>
                  onChange({ requires_guarantor: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              Requires Guarantor
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requires_collateral}
                onChange={(e) =>
                  onChange({ requires_collateral: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              Requires Collateral
            </label>
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

          {/* Row 8: Processing Fee Amount, Processing Fee % */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processing Fee Amount
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.processing_fee_amount}
              onChange={(e) =>
                onChange({ processing_fee_amount: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processing Fee %
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.processing_fee_percent}
              onChange={(e) =>
                onChange({ processing_fee_percent: e.target.value })
              }
            />
          </div>

          {/* Row 9: Penalty Rate %, Max Repayments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penalty Rate %
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.penalty_rate}
              onChange={(e) => onChange({ penalty_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Repayments (optional)
            </label>
            <Input
              type="number"
              step="1"
              min="1"
              value={form.max_repayments}
              onChange={(e) => onChange({ max_repayments: e.target.value })}
              placeholder="Leave blank for unlimited"
            />
          </div>

          {/* Row 10: Min Membership Months */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Membership Months
            </label>
            <Input
              type="number"
              step="1"
              min="0"
              value={form.min_membership_months}
              onChange={(e) =>
                onChange({ min_membership_months: e.target.value })
              }
            />
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

function InterestMethodBadge({
  method,
}: {
  method: LoanProduct["interest_method"];
}) {
  const label = method === "flat" ? "Flat" : "Reducing Balance";
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
      {label}
    </span>
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

function FrequencyLabel({
  freq,
}: {
  freq: LoanProduct["repayment_frequency"];
}) {
  const labels: Record<LoanProduct["repayment_frequency"], string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    annually: "Annually",
  };
  return <>{labels[freq]}</>;
}

export default function LoanProductsPage() {
  const { data: products, isLoading } = useLoanProducts();
  const createLoanProduct = useCreateLoanProduct();
  const deleteLoanProduct = useDeleteLoanProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });

  const updateLoanProduct = useUpdateLoanProduct(editingId ?? "");

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function resetForm() {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(product: LoanProduct) {
    setForm({
      name: product.name,
      description: product.description ?? "",
      interest_rate: product.interest_rate,
      interest_method: product.interest_method,
      repayment_frequency: product.repayment_frequency,
      min_amount: product.min_amount,
      max_amount: product.max_amount,
      min_period_months: String(product.min_period_months),
      max_period_months: String(product.max_period_months),
      max_repayments:
        product.max_repayments != null ? String(product.max_repayments) : "",
      requires_guarantor: product.requires_guarantor,
      requires_collateral: product.requires_collateral,
      min_membership_months: String(product.min_membership_months),
      processing_fee_amount: product.processing_fee_amount,
      processing_fee_percent: product.processing_fee_percent,
      penalty_rate: product.penalty_rate,
      is_active: product.is_active,
    });
    setEditingId(product.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: CreateLoanProductPayload = {
      name: form.name,
      description: form.description || null,
      interest_rate: form.interest_rate,
      interest_method: form.interest_method,
      repayment_frequency: form.repayment_frequency,
      min_amount: form.min_amount,
      max_amount: form.max_amount,
      min_period_months: parseInt(form.min_period_months, 10),
      max_period_months: parseInt(form.max_period_months, 10),
      max_repayments:
        form.max_repayments === "" ? null : parseInt(form.max_repayments, 10),
      requires_guarantor: form.requires_guarantor,
      requires_collateral: form.requires_collateral,
      min_membership_months: parseInt(form.min_membership_months, 10),
      processing_fee_amount: form.processing_fee_amount,
      processing_fee_percent: form.processing_fee_percent,
      penalty_rate: form.penalty_rate,
      is_active: form.is_active,
    };

    if (editingId) {
      updateLoanProduct.mutate(payload, {
        onSuccess: () => {
          toast.success("Loan product updated.");
          resetForm();
        },
        onError: (err) =>
          toast.error(err.message ?? "Failed to update loan product."),
      });
    } else {
      createLoanProduct.mutate(payload, {
        onSuccess: () => {
          toast.success("Loan product created.");
          resetForm();
        },
        onError: (err) =>
          toast.error(err.message ?? "Failed to create loan product."),
      });
    }
  }

  function handleDelete(product: LoanProduct) {
    if (
      !confirm(
        `Archive "${product.name}"? This will soft-delete the loan product.`,
      )
    )
      return;
    deleteLoanProduct.mutate(product.id, {
      onSuccess: () => toast.success("Loan product archived."),
      onError: (err) =>
        toast.error(err.message ?? "Failed to archive loan product."),
    });
  }

  const isPending = createLoanProduct.isPending || updateLoanProduct.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Loan Products</h2>
          <p className="mt-1 text-sm text-gray-500">
            Define loan products offered to members.
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
            Add Loan Product
          </Button>
        )}
      </div>

      {showForm && (
        <LoanProductForm
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
                  Method
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                  Frequency
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                  Min Amount
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                  Max Amount
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
                    colSpan={8}
                    className="py-8 text-center text-sm text-gray-500"
                  >
                    No loan products yet. Add one above.
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
                      <InterestMethodBadge method={product.interest_method} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <FrequencyLabel freq={product.repayment_frequency} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {parseFloat(product.min_amount).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {parseFloat(product.max_amount).toLocaleString()}
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
