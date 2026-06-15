"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";
import { RequireAbility } from "@/lib/AbilityContext";
import {
  useCommodityRequest,
  useApproveCommodityRequest,
  useRejectCommodityRequest,
  useIssueCommodityRequest,
  useMarkCommodityRequestRepaid,
} from "@/lib/api/commodities";

export default function CommodityRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: request, isLoading, error } = useCommodityRequest(id);

  const approveMut = useApproveCommodityRequest();
  const rejectMut = useRejectCommodityRequest();
  const issueMut = useIssueCommodityRequest();
  const repayMut = useMarkCommodityRequestRepaid();

  if (isLoading) return <p className="p-6 text-gray-500">Loading details...</p>;
  if (error) return <p className="p-6 text-red-500">{extractApiError(error)}</p>;
  if (!request) return <p className="p-6 text-gray-500">Not found.</p>;

  const handleApprove = () => {
    if (!confirm("Approve this request?")) return;
    approveMut.mutate(id, {
      onSuccess: () => toast.success("Request approved."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const handleReject = () => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason?.trim()) return;
    rejectMut.mutate({ id, reason: reason.trim() }, {
      onSuccess: () => toast.success("Request rejected."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const handleIssue = () => {
    if (!confirm("Are you sure? This will deduct the stock quantities from inventory.")) return;
    issueMut.mutate(id, {
      onSuccess: () => toast.success("Commodities issued."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const handleRepay = () => {
    if (!confirm("Mark this request as fully repaid?")) return;
    repayMut.mutate(id, {
      onSuccess: () => toast.success("Marked as repaid."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Request #{request.request_number}</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900">
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-medium">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-semibold capitalize text-primary">{request.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Member</dt>
              <dd>{request.member?.full_name} ({request.member?.member_number})</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Total Amount</dt>
              <dd className="font-mono">P {parseFloat(request.total_amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}</dd>
            </div>
            {request.repayment_period && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Repayment Period</dt>
                <dd>{request.repayment_period} months</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Created At</dt>
              <dd>{new Date(request.created_at).toLocaleString()}</dd>
            </div>
            {request.notes && (
              <div className="mt-3 rounded-md bg-gray-50 p-3 text-gray-600 dark:bg-gray-800">
                <p className="font-medium">Notes / Rejection Reason:</p>
                <p className="mt-1">{request.notes}</p>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-medium">Requested Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="pb-2 font-medium">Commodity</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Unit Price</th>
                  <th className="pb-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {request.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2">{it.commodity?.name ?? "—"}</td>
                    <td className="py-2 text-right font-mono">{it.quantity}</td>
                    <td className="py-2 text-right font-mono">{it.unit_price}</td>
                    <td className="py-2 text-right font-mono font-medium">{it.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RequireAbility action="manage_commodities">
        <div className="flex flex-wrap items-center gap-3">
          {request.status === "pending" && (
            <>
              <button
                onClick={handleApprove}
                disabled={approveMut.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {approveMut.isPending ? "Approving..." : "Approve Request"}
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMut.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </>
          )}

          {request.status === "approved" && (
            <button
              onClick={handleIssue}
              disabled={issueMut.isPending}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {issueMut.isPending ? "Issuing..." : "Issue Commodities (Deduct Stock)"}
            </button>
          )}

          {request.status === "issued" && (
            <button
              onClick={handleRepay}
              disabled={repayMut.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {repayMut.isPending ? "Updating..." : "Mark as Repaid"}
            </button>
          )}
        </div>
      </RequireAbility>
    </div>
  );
}
