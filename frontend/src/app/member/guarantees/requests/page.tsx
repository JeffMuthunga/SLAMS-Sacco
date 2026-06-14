"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  useMemberGuarantees,
  useAcceptGuarantee,
  useDeclineGuarantee,
  type Guarantee,
} from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

function fmtAmount(v: string) {
  return parseFloat(v).toLocaleString("en-BW", { minimumFractionDigits: 2 });
}

function GuaranteeRow({ guarantee }: { guarantee: Guarantee }) {
  const accept  = useAcceptGuarantee();
  const decline = useDeclineGuarantee();
  const [showDecline,  setShowDecline]  = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const isPending = guarantee.is_active && !guarantee.is_accepted;

  function handleAccept() {
    accept.mutate(guarantee.id, {
      onSuccess: () => toast.success("Guarantee accepted."),
      onError:   (err) => toast.error(extractApiError(err)),
    });
  }

  function handleDecline() {
    decline.mutate(
      { guaranteeId: guarantee.id, reason: declineReason || undefined },
      {
        onSuccess: () => {
          toast.success("Guarantee declined.");
          setShowDecline(false);
          setDeclineReason("");
        },
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-dark dark:text-white">
            {guarantee.loan?.member?.full_name ?? "—"}
            <span className="ml-1 text-xs text-gray-400">({guarantee.loan?.member?.member_number ?? "—"})</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {guarantee.loan?.loan_product?.name ?? "Loan"} · {guarantee.loan?.account_number ?? "—"}
          </p>
          <p className="mt-1 text-sm font-mono text-dark dark:text-white">
            BWP {fmtAmount(guarantee.guaranteed_amount)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {isPending ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
                disabled={accept.isPending}
                onClick={handleAccept}
              >
                {accept.isPending ? "Accepting…" : "Accept"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50"
                onClick={() => setShowDecline(true)}
              >
                Decline
              </Button>
            </div>
          ) : (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              guarantee.is_accepted
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}>
              {guarantee.is_accepted ? "Accepted" : "Declined"}
            </span>
          )}
        </div>
      </div>

      {showDecline && (
        <div className="mt-3 flex flex-col gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Optionally provide a reason for declining:
          </p>
          <textarea
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason (optional)…"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={decline.isPending}
              onClick={handleDecline}
            >
              {decline.isPending ? "Declining…" : "Confirm Decline"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDecline(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuaranteeRequestsPage() {
  const { data, isLoading, error } = useMemberGuarantees({ status: "pending", per_page: 50 });
  const guarantees = data?.data ?? [];

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Guarantee Requests</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Loans where you have been nominated as a guarantor.
        </p>
      </div>

      {!guarantees.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400">No pending guarantee requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {guarantees.map((g) => (
            <GuaranteeRow key={g.id} guarantee={g} />
          ))}
        </div>
      )}
    </div>
  );
}
