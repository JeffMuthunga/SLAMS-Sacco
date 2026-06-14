"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useMemberLoans, useMemberLoan, useApplyLoan, useAddMemberLoanGuarantor, useMemberSearch, type ApplyLoanPayload } from "@/lib/api/member-portal";
import { useLoanProducts } from "@/lib/api/configurations";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import SelectInput from "@/components/Forms/SelectInput";
import NumberInput from "@/components/Forms/NumberInput";
import type { Loan, LoanStatus } from "@/lib/api/loans";

const STATUS_CFG: Record<LoanStatus, { label: string; className: string }> = {
  draft:               { label: "Draft",               className: "bg-gray-100 text-gray-600" },
  applied:             { label: "Applied",             className: "bg-blue-100 text-blue-700" },
  guarantors_confirmed:{ label: "Guarantors Confirmed",className: "bg-teal-100 text-teal-700" },
  approved:            { label: "Approved",            className: "bg-yellow-100 text-yellow-700" },
  rejected:            { label: "Rejected",            className: "bg-red-100 text-red-700" },
  disbursed:           { label: "Disbursed",           className: "bg-green-100 text-green-700" },
  active:              { label: "Active",              className: "bg-green-100 text-green-700" },
  repaid:              { label: "Repaid",              className: "bg-gray-100 text-gray-600" },
  defaulted:           { label: "Defaulted",           className: "bg-red-100 text-red-700" },
};

// ── Guarantor search row ─────────────────────────────────────────────────

interface GuarantorRow {
  member_id: string;
  full_name: string;
  member_number: string;
  guaranteed_amount: string;
}

function GuarantorPickerRow({ onAdd }: { onAdd: (row: GuarantorRow) => void }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(null);
  const [amount, setAmount] = useState("");
  const { data: results = [] } = useMemberSearch(q);

  const options = results.map((m) => ({
    value: m.id,
    label: `${m.full_name} (${m.member_number})`,
  }));

  function handleAdd() {
    if (!selected || !amount) { toast.error("Select a member and enter an amount."); return; }
    const meta = results.find((m) => m.id === selected.value);
    if (!meta) return;
    onAdd({ member_id: meta.id, full_name: meta.full_name, member_number: meta.member_number, guaranteed_amount: amount });
    setSelected(null);
    setQ("");
    setAmount("");
  }

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[200px]">
        <SelectInput
          options={options}
          value={selected}
          onChange={(opt) => setSelected(opt as { value: string; label: string } | null)}
          onInputChange={(val) => setQ(val)}
          placeholder="Search member by name or number…"
        />
      </div>
      <div className="w-36">
        <NumberInput value={amount} onChange={(v) => setAmount(v)} placeholder="Amount" />
      </div>
      <Button type="button" size="sm" variant="outline" onClick={handleAdd}>
        + Add
      </Button>
    </div>
  );
}

// ── Apply loan form ──────────────────────────────────────────────────────

function ApplyLoanForm({ onClose }: { onClose: () => void }) {
  const { data: allProducts = [] } = useLoanProducts();
  const products = allProducts.filter((p) => p.is_active);
  const applyLoan = useApplyLoan();

  const [productId, setProductId]   = useState("");
  const [amount, setAmount]         = useState("");
  const [period, setPeriod]         = useState("");
  const [guarantors, setGuarantors] = useState<GuarantorRow[]>([]);

  const selectedProduct = products.find((p) => p.id === productId) ?? null;
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  function removeGuarantor(idx: number) {
    setGuarantors((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !amount || !period) { toast.error("Product, amount, and period are required."); return; }

    const payload: ApplyLoanPayload = {
      loan_product_id:  productId,
      principal_amount: amount,
      repayment_period: parseInt(period, 10),
      guarantors: guarantors.map((g) => ({ member_id: g.member_id, guaranteed_amount: g.guaranteed_amount })),
    };

    applyLoan.mutate(payload, {
      onSuccess: () => { toast.success("Loan application submitted."); onClose(); },
      onError:   (err) => toast.error(extractApiError(err)),
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark dark:text-white">Apply for a Loan</h2>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">✕ Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Loan Product <span className="text-red-500">*</span>
          </label>
          <SelectInput
            options={productOptions}
            value={productOptions.find((o) => o.value === productId) ?? null}
            onChange={(opt) => setProductId((opt as { value: string } | null)?.value ?? "")}
            placeholder="Select product…"
          />
          {selectedProduct && (
            <p className="mt-1 text-xs text-gray-400">
              {selectedProduct.interest_rate}% p.a. · {selectedProduct.interest_method} · {selectedProduct.min_period_months}–{selectedProduct.max_period_months} months
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (KES) <span className="text-red-500">*</span>
            </label>
            <NumberInput value={amount} onChange={setAmount} placeholder="e.g. 50000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Repayment Period (months) <span className="text-red-500">*</span>
            </label>
            <NumberInput value={period} onChange={setPeriod} placeholder="e.g. 12" />
          </div>
        </div>

        {(selectedProduct?.requires_guarantor || guarantors.length > 0) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Guarantors{selectedProduct?.requires_guarantor ? " *" : ""}
            </label>
            {guarantors.length > 0 && (
              <div className="mb-2 flex flex-col gap-1">
                {guarantors.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-800">
                    <span>{g.full_name} ({g.member_number})</span>
                    <span className="font-mono">KES {parseFloat(g.guaranteed_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
                    <button type="button" onClick={() => removeGuarantor(i)} className="text-red-400 hover:text-red-600 text-xs ml-2">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <GuarantorPickerRow onAdd={(row) => setGuarantors((prev) => [...prev, row])} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={applyLoan.isPending}>
            {applyLoan.isPending ? "Submitting…" : "Submit Application"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Replacement guarantor row ────────────────────────────────────────────

function ReplacementGuarantorRow({ loanId }: { loanId: string }) {
  const [q, setQ]           = useState("");
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(null);
  const [amount, setAmount] = useState("");
  const { data: results = [] } = useMemberSearch(q);
  const addGuarantor = useAddMemberLoanGuarantor(loanId);

  const options = results.map((m) => ({ value: m.id, label: `${m.full_name} (${m.member_number})` }));

  function handleAdd() {
    if (!selected || !amount) { toast.error("Select a member and enter an amount."); return; }
    addGuarantor.mutate(
      { member_id: selected.value, guaranteed_amount: amount },
      {
        onSuccess: () => { toast.success("Replacement guarantor added."); setSelected(null); setQ(""); setAmount(""); },
        onError:   (err) => toast.error(extractApiError(err)),
      }
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[200px]">
        <SelectInput
          options={options}
          value={selected}
          onChange={(opt) => setSelected(opt as { value: string; label: string } | null)}
          onInputChange={(val) => setQ(val)}
          placeholder="Search replacement guarantor…"
        />
      </div>
      <div className="w-36">
        <NumberInput value={amount} onChange={setAmount} placeholder="Amount" />
      </div>
      <Button type="button" size="sm" onClick={handleAdd} disabled={addGuarantor.isPending}>
        {addGuarantor.isPending ? "Adding…" : "Add"}
      </Button>
    </div>
  );
}

// ── Loan card ────────────────────────────────────────────────────────────

function LoanCard({ loan, selected, onClick }: { loan: Loan; selected: boolean; onClick: () => void }) {
  const cfg = STATUS_CFG[loan.loan_status] ?? { label: loan.loan_status, className: "bg-gray-100 text-gray-600" };
  const hasDeclined = loan.guarantees?.some((g) => g.approval_status === "rejected") ?? false;

  return (
    <div className="flex flex-col gap-0">
      <button
        onClick={onClick}
        className={`w-full rounded-xl border p-4 text-left transition-colors ${
          selected ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-primary/50 dark:border-gray-700 dark:bg-gray-dark"
        } ${hasDeclined ? "rounded-b-none border-b-0" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm text-gray-500">{loan.account_number}</p>
            <p className="mt-0.5 text-sm font-medium text-dark dark:text-white">
              {(loan.loan_product as { name?: string } | null)?.name ?? "Loan"}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-500">Principal</p>
            <p className="font-medium">KES {Number(loan.principal_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-gray-500">Outstanding</p>
            <p className="font-medium">KES {Number(loan.outstanding_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </button>

      {hasDeclined && ["applied", "guarantors_confirmed"].includes(loan.loan_status) && (
        <div className="rounded-b-xl border border-t-0 border-yellow-300 bg-yellow-50 px-4 py-3 dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
            One or more guarantors declined. Nominate a replacement to proceed.
          </p>
          <ReplacementGuarantorRow loanId={loan.id} />
        </div>
      )}
    </div>
  );
}

// ── Loan detail panel ────────────────────────────────────────────────────

function LoanDetail({ loanId }: { loanId: string }) {
  const { data: loan, isLoading, error } = useMemberLoan(loanId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error)     return <p className="text-sm text-red-500">{extractApiError(error)}</p>;
  if (!loan)     return null;

  const cfg = STATUS_CFG[loan.loan_status] ?? { label: loan.loan_status, className: "bg-gray-100 text-gray-600" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-gray-500">{loan.account_number}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {([
          ["Principal",        `KES ${Number(loan.principal_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Outstanding",      `KES ${Number(loan.outstanding_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Interest Rate",    `${loan.interest_rate}% p.a.`],
          ["Repayment Period", `${loan.repayment_period} months`],
          ["Repayment Amount", `KES ${Number(loan.repayment_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Disbursed Date",   loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString("en-KE") : "—"],
          ["Maturity Date",    loan.maturity_date  ? new Date(loan.maturity_date).toLocaleDateString("en-KE")  : "—"],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-medium text-dark dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {loan.guarantees && loan.guarantees.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-dark dark:text-white">Guarantors</h3>
          <div className="flex flex-col gap-1">
            {loan.guarantees.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-xs border-b pb-1.5 last:border-0">
                <span>{g.member?.full_name ?? "—"} ({g.member?.member_number ?? "—"})</span>
                <span className="font-mono">KES {Number(g.guaranteed_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
                <span className={
                  g.is_accepted ? "text-green-600" :
                  g.approval_status === "rejected" ? "text-red-500" :
                  "text-yellow-600"
                }>
                  {g.is_accepted ? "Accepted" : g.approval_status === "rejected" ? "Declined" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loan.repayments && loan.repayments.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-dark dark:text-white">Repayment Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500">Due Date</th>
                  <th className="pb-2 text-right text-gray-500">Total Due</th>
                  <th className="pb-2 text-right text-gray-500">Total Paid</th>
                  <th className="pb-2 text-right text-gray-500">Balance</th>
                  <th className="pb-2 text-left text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.repayments.map((r) => {
                  const statusCfg: Record<string, string> = {
                    pending: "text-gray-600", partial: "text-yellow-600",
                    paid:    "text-green-600", overdue: "text-red-600",
                  };
                  return (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-1.5">{new Date(r.due_date).toLocaleDateString("en-KE")}</td>
                      <td className="py-1.5 text-right">KES {Number(r.total_due).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right">KES {Number(r.total_paid).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right">KES {Number(r.balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className={`py-1.5 capitalize font-medium ${statusCfg[r.repayment_status] ?? ""}`}>
                        {r.repayment_status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function MemberLoansPage() {
  const { data, isLoading, error } = useMemberLoans({ per_page: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showApply,  setShowApply]  = useState(false);

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;

  const loans      = data?.data ?? [];
  const effectiveId = selectedId ?? loans[0]?.id ?? null;

  if (showApply) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Loans</h1>
        <ApplyLoanForm onClose={() => setShowApply(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Loans</h1>
        <Button onClick={() => setShowApply(true)}>+ Apply for Loan</Button>
      </div>

      {!loans.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400 mb-4">No loans yet.</p>
          <Button onClick={() => setShowApply(true)}>Apply for Your First Loan</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            {loans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                selected={effectiveId === loan.id}
                onClick={() => setSelectedId(loan.id)}
              />
            ))}
          </div>
          <div className="lg:col-span-2">
            {effectiveId && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
                <h2 className="mb-4 font-semibold text-dark dark:text-white">Loan Details</h2>
                <LoanDetail loanId={effectiveId} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
