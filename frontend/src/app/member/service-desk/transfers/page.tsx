"use client";

import React from "react";
import { useMemberAccounts } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";

export default function MemberTransfersPage() {
  const { data: accounts, isLoading, error } = useMemberAccounts();

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Transfers</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
        <p className="text-sm text-gray-500">
          Inter-account transfers are processed by SACCO staff. Please visit the Service Desk
          or raise an issue if you need a fund transfer between your accounts.
        </p>
        {accounts && accounts.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-dark dark:text-white">Your Accounts</p>
            <div className="flex flex-col gap-2">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <div>
                    <p className="font-mono text-sm">{acc.account_number}</p>
                    <p className="text-xs text-gray-500">
                      {(acc.product as { name?: string } | null)?.name ?? "Savings"}
                    </p>
                  </div>
                  <p className="font-medium">
                    BWP {Number(acc.balance).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
