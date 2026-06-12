"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useDeleteCurrency,
  type Currency,
  type CreateCurrencyPayload,
} from "@/lib/api/configurations";

type FormValues = {
  name: string;
  code: string;
  symbol: string;
  exchange_rate: string;
  is_default: boolean;
};

function CurrencyForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      symbol: defaultValues?.symbol ?? "",
      exchange_rate: defaultValues?.exchange_rate ?? "",
      is_default: defaultValues?.is_default ?? false,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-gray-700">
        {defaultValues?.code ? "Edit Currency" : "Add Currency"}
      </h3>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("name", { required: "Name is required" })}
            placeholder="Kenyan Shilling"
            className="text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Code */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Code <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("code", {
              required: "Code is required",
              maxLength: { value: 3, message: "Max 3 characters" },
              setValueAs: (v: string) => v.toUpperCase(),
            })}
            maxLength={3}
            placeholder="KES"
            className="text-sm uppercase"
          />
          {errors.code && (
            <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
          )}
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Symbol
          </label>
          <Input
            {...register("symbol")}
            placeholder="KSh"
            className="text-sm"
          />
        </div>

        {/* Exchange Rate */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Exchange Rate
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register("exchange_rate", {
              min: { value: 0, message: "Must be positive" },
            })}
            placeholder="1.00"
            className="text-sm"
          />
          {errors.exchange_rate && (
            <p className="mt-1 text-xs text-red-600">
              {errors.exchange_rate.message}
            </p>
          )}
        </div>
      </div>

      {/* Is Default */}
      <div className="flex items-center gap-2">
        <input
          id="is_default"
          type="checkbox"
          {...register("is_default")}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label
          htmlFor="is_default"
          className="text-sm font-medium text-gray-700"
        >
          Set as default currency
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function CurrenciesPage() {
  const { data: currencies = [], isLoading } = useCurrencies();
  const createCurrency = useCreateCurrency();
  const deleteCurrency = useDeleteCurrency();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateCurrency = useUpdateCurrency(editingId ?? "");

  function handleCreate(values: FormValues) {
    const payload: CreateCurrencyPayload = {
      name: values.name,
      code: values.code.toUpperCase(),
      symbol: values.symbol || null,
      exchange_rate: values.exchange_rate || "1.00",
      is_default: values.is_default,
    };
    createCurrency.mutate(payload, {
      onSuccess: () => {
        toast.success("Currency added.");
        setShowForm(false);
      },
      onError: (err) => toast.error(err.message ?? "Failed to add currency."),
    });
  }

  function handleUpdate(values: FormValues) {
    const payload: CreateCurrencyPayload = {
      name: values.name,
      code: values.code.toUpperCase(),
      symbol: values.symbol || null,
      exchange_rate: values.exchange_rate || "1.00",
      is_default: values.is_default,
    };
    updateCurrency.mutate(payload, {
      onSuccess: () => {
        toast.success("Currency updated.");
        setEditingId(null);
      },
      onError: (err) =>
        toast.error(err.message ?? "Failed to update currency."),
    });
  }

  function handleDelete(c: Currency) {
    if (!confirm(`Delete currency "${c.name}"?`)) return;
    deleteCurrency.mutate(c.id, {
      onSuccess: () => toast.success("Currency deleted."),
      onError: (err) =>
        toast.error(err.message ?? "Failed to delete currency."),
    });
  }

  const editingCurrency = editingId
    ? currencies.find((c) => c.id === editingId)
    : null;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Currencies</h2>
        {!showForm && !editingId && (
          <Button onClick={() => setShowForm(true)} size="sm">
            Add Currency
          </Button>
        )}
      </div>

      {/* Inline create form */}
      {showForm && (
        <CurrencyForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isPending={createCurrency.isPending}
        />
      )}

      {/* Inline edit form */}
      {editingId && editingCurrency && (
        <CurrencyForm
          defaultValues={{
            name: editingCurrency.name,
            code: editingCurrency.code,
            symbol: editingCurrency.symbol ?? "",
            exchange_rate: editingCurrency.exchange_rate,
            is_default: editingCurrency.is_default,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditingId(null)}
          isPending={updateCurrency.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Symbol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Exchange Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Default
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currencies.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No currencies added yet.
                  </td>
                </tr>
              ) : (
                currencies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {c.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {c.symbol ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {c.exchange_rate}
                    </td>
                    <td className="px-4 py-3">
                      {c.is_default && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingId(c.id);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={c.is_default || deleteCurrency.isPending}
                          className="text-xs text-red-600 hover:text-red-900 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
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
