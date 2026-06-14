"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AccountStatusBadge } from "@/components/Accounts/AccountStatusBadge";
import TransactionsTable from "@/components/Accounts/TransactionsTable";
import TransactionForm from "@/components/Accounts/TransactionForm";
import {
  useAccount,
  useAccountStatement,
  useApproveAccount,
  useRejectAccount,
  useCloseAccount,
} from "@/lib/api/accounts";
import { extractApiError } from "@/lib/api";

function formatBalance(value: string): string {
  return parseFloat(value).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: account, isLoading, error } = useAccount(id);
  const { data: statement, isLoading: loadingStatement, refetch: refetchStatement } = useAccountStatement(id);

  const approveMutation = useApproveAccount();
  const rejectMutation  = useRejectAccount();
  const closeMutation   = useCloseAccount();

  const [showTxModal, setShowTxModal]       = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async () => {
    if (!window.confirm("Approve this account?")) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Account approved.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(id);
      toast.success("Account rejected.");
      setShowRejectModal(false);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Close this account? This action soft-deletes the account.")) return;
    try {
      await closeMutation.mutateAsync(id);
      toast.success("Account closed.");
      router.push("/admin/accounts");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error || !account) return <p className="text-sm text-red-500">{extractApiError(error)}</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            {account.account_number}
          </h1>
          <p className="text-sm text-gray-500">{account.member?.full_name ?? "—"} &middot; {account.product?.name ?? "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {account.approval_status === "pending" && (
            <>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Reject
              </button>
            </>
          )}
          {account.is_active && (
            <>
              <button
                onClick={() => setShowTxModal(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                + Post Transaction
              </button>
              <button
                onClick={handleClose}
                disabled={closeMutation.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close Account
              </button>
            </>
          )}
          <Link
            href={`/admin/accounts/${id}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <Link
            href="/admin/accounts"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Balance</p>
          <p className="text-xl font-bold text-dark dark:text-white">
            {formatBalance(account.balance)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <AccountStatusBadge status={account.approval_status} />
        </div>
        <div>
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-sm font-medium">{account.is_active ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Locked</p>
          <p className="text-sm font-medium">
            {account.is_locked ? `Yes (until ${account.locked_until_date ?? "—"})` : "No"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Interest Rate</p>
          <p className="text-sm font-medium">{account.interest_rate}% p.a.</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Opening Date</p>
          <p className="text-sm font-medium">
            {account.opening_date ? new Date(account.opening_date).toLocaleDateString("en-BW") : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Last Activity</p>
          <p className="text-sm font-medium">
            {account.last_activity_date
              ? new Date(account.last_activity_date).toLocaleDateString("en-BW")
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Member #</p>
          <p className="text-sm font-medium">{account.member?.member_number ?? "—"}</p>
        </div>
      </div>

      {/* Statement */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-dark dark:text-white">Transaction Statement</h2>
        <TransactionsTable
          data={statement?.transactions ?? []}
          isLoading={loadingStatement}
        />
      </div>

      {/* Reject confirm modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Reject Account</h3>
            <p className="mb-4 text-sm text-gray-600">Are you sure you want to reject this account?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {rejectMutation.isPending ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Post Transaction</h3>
              <button
                onClick={() => setShowTxModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <TransactionForm
              accountId={id}
              onSuccess={() => {
                setShowTxModal(false);
                refetchStatement();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
