"use client";

import React, { useState } from "react";
import {
  ChartOfAccount,
  useAccountTypes,
  useChartOfAccounts,
  useCreateChartOfAccount,
  useDeleteChartOfAccount,
  useUpdateChartOfAccount,
} from "@/lib/api/journals";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";

interface FormState {
  account_type_id: string;
  parent_id: string;
  code: string;
  name: string;
  is_header: boolean;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  account_type_id: "",
  parent_id: "",
  code: "",
  name: "",
  is_header: false,
  is_active: true,
};

function AccountForm({
  initial,
  onClose,
  onSave,
  isPending,
  errors,
}: {
  initial: FormState;
  onClose: () => void;
  onSave: (f: FormState) => void;
  isPending: boolean;
  errors: Record<string, string[]> | null;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const { data: accountTypes = [] } = useAccountTypes();
  const { data: accounts = [] } = useChartOfAccounts({ active_only: true });

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => errors?.[k]?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {initial.code ? "Edit Account" : "New Account"}
        </h2>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form); }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Account Type</label>
              <select
                value={form.account_type_id}
                onChange={(e) => set("account_type_id", e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {accountTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.code} – {t.name}</option>
                ))}
              </select>
              {err("account_type_id") && <p className="mt-0.5 text-xs text-red-500">{err("account_type_id")}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Parent Account</label>
              <select
                value={form.parent_id}
                onChange={(e) => set("parent_id", e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— none (top-level) —</option>
                {accounts.filter((a) => a.is_header).map((a) => (
                  <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Code</label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="e.g. 1001"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
              {err("code") && <p className="mt-0.5 text-xs text-red-500">{err("code")}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Account name"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
              {err("name") && <p className="mt-0.5 text-xs text-red-500">{err("name")}</p>}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_header}
                onChange={(e) => set("is_header", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Header (group account)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChartOfAccountsPage() {
  const [typeFilter, setTypeFilter]     = useState("");
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState<ChartOfAccount | null>(null);
  const [formErrors, setFormErrors]     = useState<Record<string, string[]> | null>(null);

  const { data: accountTypes = [] } = useAccountTypes();
  const { data: accounts = [], isLoading, error } = useChartOfAccounts(
    typeFilter ? { account_type_id: typeFilter } : undefined
  );
  const createMutation = useCreateChartOfAccount();
  const updateMutation = useUpdateChartOfAccount();
  const deleteMutation = useDeleteChartOfAccount();

  const openCreate = () => { setEditing(null); setFormErrors(null); setShowForm(true); };
  const openEdit   = (a: ChartOfAccount) => { setEditing(a); setFormErrors(null); setShowForm(true); };
  const closeForm  = () => setShowForm(false);

  const handleSave = (form: FormState) => {
    const payload = {
      account_type_id: form.account_type_id,
      parent_id: form.parent_id || null,
      code: form.code,
      name: form.name,
      is_header: form.is_header,
      is_active: form.is_active,
    };

    const onError = (err: Error) => {
      const fe = extractFieldErrors(err);
      if (fe) { setFormErrors(fe); } else { toast.error(extractApiError(err)); }
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, ...payload },
        { onSuccess: () => { toast.success("Account updated."); closeForm(); }, onError }
      );
    } else {
      createMutation.mutate(
        payload as Parameters<typeof createMutation.mutate>[0],
        { onSuccess: () => { toast.success("Account created."); closeForm(); }, onError }
      );
    }
  };

  const handleDelete = (a: ChartOfAccount) => {
    if (!confirm(`Delete account "${a.code} – ${a.name}"?`)) return;
    deleteMutation.mutate(a.id, {
      onSuccess: () => toast.success("Account deleted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const editingForm: FormState = editing
    ? {
        account_type_id: editing.account_type_id,
        parent_id: editing.parent_id ?? "",
        code: editing.code,
        name: editing.name,
        is_header: editing.is_header,
        is_active: editing.is_active,
      }
    : EMPTY_FORM;

  return (
    <div className="flex flex-col gap-6">
      {showForm && (
        <AccountForm
          initial={editingForm}
          onClose={closeForm}
          onSave={handleSave}
          isPending={createMutation.isPending || updateMutation.isPending}
          errors={formErrors}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Chart of Accounts</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + New Account
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {accountTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.code} – {t.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Parent</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Header</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Active</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-mono font-medium">{a.code}</td>
                <td className="px-4 py-3">{a.name}</td>
                <td className="px-4 py-3 text-gray-500">{a.account_type?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{a.parent ? `${a.parent.code} – ${a.parent.name}` : "—"}</td>
                <td className="px-4 py-3">
                  {a.is_header ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Header</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {a.is_active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Active</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(a)}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No accounts found. Add your first account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
