"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import NumberInput from "@/components/Forms/NumberInput";
import DateInput from "@/components/Forms/DateInput";
import { useCreateTransaction, useAccounts } from "@/lib/api/accounts";
import { extractApiError, extractFieldErrors } from "@/lib/api";

const TX_TYPE_OPTIONS = [
  { label: "Deposit",      value: "deposit" },
  { label: "Withdrawal",   value: "withdrawal" },
  { label: "Transfer Out", value: "transfer_out" },
];

interface Props {
  accountId: string;
  onSuccess: () => void;
}

interface FormErrors {
  transaction_type?: string;
  to_account_id?: string;
  amount?: string;
  transaction_date?: string;
  reference_number?: string;
  narration?: string;
}

export default function TransactionForm({ accountId, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [txType, setTxType]               = useState<"deposit" | "withdrawal" | "transfer_out">("deposit");
  const [toAccountSearch, setToAccountSearch] = useState("");
  const [toAccountId, setToAccountId]     = useState("");
  const [amount, setAmount]               = useState("");
  const [txDate, setTxDate]               = useState(today);
  const [reference, setReference]         = useState("");
  const [narration, setNarration]         = useState("");
  const [errors, setErrors]               = useState<FormErrors>({});

  const createTx = useCreateTransaction();

  // For transfer: search other accounts
  const { data: accountsData } = useAccounts(
    txType === "transfer_out" && toAccountSearch.length >= 3
      ? { search: toAccountSearch, status: "approved", per_page: 10 }
      : undefined
  );

  const toAccountOptions = (accountsData?.data ?? []).filter((a) => a.id !== accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await createTx.mutateAsync({
        deposit_account_id: accountId,
        transaction_type: txType,
        to_account_id: txType === "transfer_out" ? toAccountId : undefined,
        amount,
        reference_number: reference || undefined,
        transaction_date: txDate,
        narration: narration || undefined,
      });
      toast.success("Transaction posted successfully.");
      onSuccess();
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors as FormErrors);
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Transaction Type */}
      <div className="w-full">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Transaction Type <span className="text-red-500">*</span>
        </label>
        <select
          value={txType}
          onChange={(e) => {
            setTxType(e.target.value as typeof txType);
            setToAccountId("");
            setToAccountSearch("");
          }}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
        >
          {TX_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {errors.transaction_type && (
          <p className="mt-1 text-sm text-red-500">{errors.transaction_type}</p>
        )}
      </div>

      {/* Transfer destination */}
      {txType === "transfer_out" && (
        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Destination Account <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Search account number (min 3 chars)…"
            value={toAccountSearch}
            onChange={(e) => {
              setToAccountSearch(e.target.value);
              setToAccountId("");
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          />
          {toAccountOptions.length > 0 && !toAccountId && (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
              {toAccountOptions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setToAccountId(a.id);
                    setToAccountSearch(a.account_number);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-green-50"
                >
                  {a.account_number} — {a.member?.full_name ?? "—"}
                </button>
              ))}
            </div>
          )}
          {errors.to_account_id && (
            <p className="mt-1 text-sm text-red-500">{errors.to_account_id}</p>
          )}
        </div>
      )}

      {/* Amount */}
      <NumberInput
        label="Amount"
        id="amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        min={0.01}
        step="any"
        required
        error={errors.amount}
      />

      {/* Date */}
      <DateInput
        label="Transaction Date"
        id="txDate"
        value={txDate}
        onChange={(d) => setTxDate(d)}
        required
        error={errors.transaction_date}
      />

      {/* Reference */}
      <div className="w-full">
        <label className="mb-2 block text-sm font-medium text-gray-700">Reference #</label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Optional"
          maxLength={50}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
        />
        {errors.reference_number && (
          <p className="mt-1 text-sm text-red-500">{errors.reference_number}</p>
        )}
      </div>

      {/* Narration */}
      <div className="w-full">
        <label className="mb-2 block text-sm font-medium text-gray-700">Narration</label>
        <textarea
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          placeholder="Optional description"
          maxLength={255}
          rows={2}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
        />
        {errors.narration && (
          <p className="mt-1 text-sm text-red-500">{errors.narration}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={createTx.isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {createTx.isPending ? "Posting…" : "Post Transaction"}
      </button>
    </form>
  );
}
