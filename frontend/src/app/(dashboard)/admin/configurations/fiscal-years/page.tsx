"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useFiscalYears,
  useCreateFiscalYear,
  useCloseFiscalYear,
  type FiscalYear,
  type CreateFiscalYearPayload,
} from "@/lib/api/configurations";

type FormValues = {
  name: string;
  start_date: string;
  end_date: string;
};

function StatusBadge({ fy }: { fy: FiscalYear }) {
  if (fy.is_closed) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        Closed
      </span>
    );
  }
  if (fy.is_opened) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Open
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
      Draft
    </span>
  );
}

export default function FiscalYearsPage() {
  const { data: fiscalYears = [], isLoading } = useFiscalYears();
  const createFiscalYear = useCreateFiscalYear();
  const closeFiscalYear = useCloseFiscalYear();

  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", start_date: "", end_date: "" },
  });

  function onSubmit(values: FormValues) {
    const payload: CreateFiscalYearPayload = {
      name: values.name,
      start_date: values.start_date,
      end_date: values.end_date,
    };
    createFiscalYear.mutate(payload, {
      onSuccess: () => {
        toast.success("Fiscal year created.");
        reset();
        setShowForm(false);
      },
      onError: (err) =>
        toast.error(err.message ?? "Failed to create fiscal year."),
    });
  }

  function handleClose(fy: FiscalYear) {
    if (!confirm(`Close fiscal year "${fy.name}"? This cannot be undone.`))
      return;
    closeFiscalYear.mutate(fy.id, {
      onSuccess: () => toast.success(`"${fy.name}" closed.`),
      onError: (err) =>
        toast.error(err.message ?? "Failed to close fiscal year."),
    });
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Fiscal Years</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            New Fiscal Year
          </Button>
        )}
      </div>

      {/* Inline create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4"
        >
          <h3 className="text-sm font-semibold text-gray-700">
            New Fiscal Year
          </h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("name", { required: "Name is required" })}
                placeholder="FY 2025/2026"
                className="text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                {...register("start_date")}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End Date
              </label>
              <Input
                type="date"
                {...register("end_date")}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={createFiscalYear.isPending}
              size="sm"
            >
              {createFiscalYear.isPending ? "Creating..." : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                setShowForm(false);
              }}
              disabled={createFiscalYear.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {fiscalYears.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No fiscal years yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                fiscalYears.map((fy) => (
                  <tr key={fy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-900">
                      <Link
                        href={`/admin/configurations/fiscal-years/${fy.id}`}
                      >
                        {fy.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {fy.start_date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {fy.end_date}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge fy={fy} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fy.is_opened && !fy.is_closed && (
                        <button
                          type="button"
                          onClick={() => handleClose(fy)}
                          disabled={closeFiscalYear.isPending}
                          className="text-xs text-red-600 hover:text-red-900 font-medium disabled:opacity-40"
                        >
                          Close
                        </button>
                      )}
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
