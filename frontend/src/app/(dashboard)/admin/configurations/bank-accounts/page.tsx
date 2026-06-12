"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  BankAccount,
  CreateBankAccountPayload,
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useBanks,
} from "@/lib/api/configurations";

type FormData = {
  bank_id: string;
  account_name: string;
  account_number: string;
  branch: string;
  is_active: boolean;
};

const defaultForm: FormData = {
  bank_id: "",
  account_name: "",
  account_number: "",
  branch: "",
  is_active: true,
};

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Inactive
    </span>
  );
}

export default function BankAccountsPage() {
  const { data: items, isLoading } = useBankAccounts();
  const { data: banks } = useBanks();
  const createMutation = useCreateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const updateMutation = useUpdateBankAccount(editingId ?? "");

  const resetForm = () => {
    setFormData(defaultForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: BankAccount) => {
    setFormData({
      bank_id: item.bank_id,
      account_name: item.account_name,
      account_number: item.account_number,
      branch: item.branch ?? "",
      is_active: item.is_active,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateBankAccountPayload = {
      bank_id: formData.bank_id,
      account_name: formData.account_name,
      account_number: formData.account_number,
      branch: formData.branch || null,
      is_active: formData.is_active,
    };

    if (editingId) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Bank account updated.");
          resetForm();
        },
        onError: (err) => toast.error(err.message ?? "Update failed."),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Bank account created.");
          resetForm();
        },
        onError: (err) => toast.error(err.message ?? "Create failed."),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to archive this bank account?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Bank account archived."),
      onError: (err) => toast.error(err.message ?? "Archive failed."),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bank Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage SACCO bank accounts used for transactions.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none"
        >
          Add Bank Account
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {editingId ? "Edit Bank Account" : "New Bank Account"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bank <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.bank_id}
                onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a bank…</option>
                {banks?.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={120}
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                required
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <input
                type="text"
                maxLength={100}
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Bank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Account Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Account Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Branch
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Active
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && (!items || items.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No bank accounts yet.
                </td>
              </tr>
            )}
            {items?.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {item.bank?.name ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {item.account_name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {item.account_number}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {item.branch ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <ActiveBadge active={item.is_active} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <button
                    onClick={() => handleEdit(item)}
                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Archive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
