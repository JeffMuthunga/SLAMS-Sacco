"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IssueCategory,
  useIssueCategories,
  useCreateIssueCategory,
  useUpdateIssueCategory,
  useDeleteIssueCategory,
} from "@/lib/api/issues";
import { extractApiError } from "@/lib/api";

const defaultForm = { name: "", description: "" };

export default function IssueCategoriesPage() {
  const { data: items, isLoading } = useIssueCategories();
  const createMutation = useCreateIssueCategory();
  const updateMutation = useUpdateIssueCategory();
  const deleteMutation = useDeleteIssueCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const resetForm = () => {
    setForm(defaultForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: IssueCategory) => {
    setForm({ name: item.name, description: item.description ?? "" });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, description: form.description || undefined };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => { toast.success("Category updated."); resetForm(); },
          onError: (err) => toast.error(extractApiError(err)),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success("Category created."); resetForm(); },
        onError: (err) => toast.error(extractApiError(err)),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this category?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Category deleted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">Issue Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Manage categories used to classify support issues.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">
            {editingId ? "Edit Category" : "New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {isPending ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">Loading…</td></tr>
            )}
            {!isLoading && (!items || items.length === 0) && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">No categories yet.</td></tr>
            )}
            {items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-dark dark:text-white">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.description ?? "—"}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <button onClick={() => handleEdit(item)} className="mr-3 text-primary hover:underline">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
