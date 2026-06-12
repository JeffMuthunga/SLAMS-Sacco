"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useFiscalYears,
  usePeriods,
  useUpdatePeriodStatus,
  type FiscalYear,
  type Period,
} from "@/lib/api/configurations";

function FiscalYearStatusBadge({ fy }: { fy: FiscalYear }) {
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

function PeriodStatusBadge({ period }: { period: Period }) {
  if (period.is_posted) {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
        Posted
      </span>
    );
  }
  if (period.is_closed) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        Closed
      </span>
    );
  }
  if (period.is_opened) {
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

export default function FiscalYearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: fiscalYears = [], isLoading: fyLoading } = useFiscalYears();
  const { data: periods = [], isLoading: periodsLoading } = usePeriods(id);
  const updatePeriodStatus = useUpdatePeriodStatus();

  const fiscalYear = fiscalYears.find((fy) => fy.id === id);

  function handlePeriodAction(
    period: Period,
    action: "open" | "close",
  ) {
    updatePeriodStatus.mutate(
      { id: period.id, status: action },
      {
        onSuccess: () =>
          toast.success(
            `Period "${period.name}" ${action === "open" ? "opened" : "closed"}.`,
          ),
        onError: (err) =>
          toast.error(err.message ?? `Failed to ${action} period.`),
      },
    );
  }

  if (fyLoading) {
    return (
      <div className="max-w-5xl">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!fiscalYear) {
    return (
      <div className="max-w-5xl">
        <p className="text-sm text-red-600">Fiscal year not found.</p>
        <Link
          href="/admin/configurations/fiscal-years"
          className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-900"
        >
          Back to Fiscal Years
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/configurations/fiscal-years"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          Fiscal Years
        </Link>
        <span className="mx-1 text-gray-400">/</span>
        <span className="text-sm text-gray-700">{fiscalYear.name}</span>
      </div>

      {/* Fiscal Year header card */}
      <div className="bg-white p-5 rounded-lg shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {fiscalYear.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {fiscalYear.start_date} &mdash; {fiscalYear.end_date}
            </p>
          </div>
          <FiscalYearStatusBadge fy={fiscalYear} />
        </div>
      </div>

      {/* Periods table */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Periods
        </h3>

        {periodsLoading ? (
          <p className="text-sm text-gray-500">Loading periods...</p>
        ) : (
          <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Period
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
                {periods.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No periods found for this fiscal year.
                    </td>
                  </tr>
                ) : (
                  periods.map((period) => (
                    <tr key={period.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {period.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {period.start_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {period.end_date}
                      </td>
                      <td className="px-4 py-3">
                        <PeriodStatusBadge period={period} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!period.is_opened &&
                          !period.is_closed &&
                          !period.is_posted && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePeriodAction(period, "open")
                              }
                              disabled={updatePeriodStatus.isPending}
                              className="text-xs text-green-600 hover:text-green-900 font-medium disabled:opacity-40"
                            >
                              Open
                            </button>
                          )}
                        {period.is_opened && !period.is_closed && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePeriodAction(period, "close")
                            }
                            disabled={updatePeriodStatus.isPending}
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
    </div>
  );
}
