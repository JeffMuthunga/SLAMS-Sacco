"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LoanStatusBadge } from "@/components/Loans/LoanStatusBadge";
import RepaymentScheduleTable from "@/components/Loans/RepaymentScheduleTable";
import DateInput from "@/components/Forms/DateInput";
import SelectInput from "@/components/Forms/SelectInput";
import {
  useLoan,
  useApproveLoan,
  useRejectLoan,
  useDisburseLoan,
  useMarkDefaulted,
  useAddLoanNote,
  useArchiveLoan,
  useAddLoanGuarantor,
} from "@/lib/api/loans";
import { useAccounts } from "@/lib/api/accounts";
import { useMembers } from "@/lib/api/members";
import { extractApiError } from "@/lib/api";
import NumberInput from "@/components/Forms/NumberInput";

function fmt(v: string) {
  return parseFloat(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const id     = params.id;
  const router = useRouter();

  const { data: loan, isLoading, error } = useLoan(id);

  const approveMutation   = useApproveLoan();
  const rejectMutation    = useRejectLoan();
  const disburseMutation  = useDisburseLoan();
  const defaultMutation   = useMarkDefaulted();
  const noteMutation      = useAddLoanNote();
  const archiveMutation   = useArchiveLoan();

  const [showRejectModal,   setShowRejectModal]   = useState(false);
  const [rejectReason,      setRejectReason]      = useState("");
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseAccountId, setDisburseAccountId] = useState("");
  const [disburseDate,      setDisburseDate]      = useState(new Date().toISOString().slice(0, 10));
  const [accountSearch,     setAccountSearch]     = useState("");
  const [noteText,          setNoteText]          = useState("");
  const [showNoteForm,      setShowNoteForm]       = useState(false);
  const [showAddGuarantor,  setShowAddGuarantor]  = useState(false);
  const [guarantorSearch,   setGuarantorSearch]   = useState("");
  const [guarantorMemberId, setGuarantorMemberId] = useState("");
  const [guarantorAmount,   setGuarantorAmount]   = useState("");
  const addGuarantorMutation = useAddLoanGuarantor(id);
  const { data: guarantorMembersData } = useMembers(
    guarantorSearch.length >= 2 ? { search: guarantorSearch, per_page: 20 } : undefined
  );
  const guarantorMemberOptions = (guarantorMembersData?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.full_name} (${m.member_number})`,
  }));

  const { data: accountsData } = useAccounts(
    accountSearch.length >= 2
      ? { search: accountSearch, status: "approved", per_page: 20 }
      : loan?.member
        ? { member_id: loan.member.id, status: "approved", per_page: 20 }
        : undefined
  );

  const accountOptions = (accountsData?.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.account_number} — ${a.member?.full_name ?? ""}`,
  }));

  const handleApprove = async () => {
    if (!window.confirm("Approve this loan?")) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Loan approved.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Reason required."); return; }
    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
      toast.success("Loan rejected.");
      setShowRejectModal(false);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleDisburse = async () => {
    if (!disburseAccountId) { toast.error("Select a disbursement account."); return; }
    try {
      await disburseMutation.mutateAsync({ id, disburse_account_id: disburseAccountId, disbursed_date: disburseDate });
      toast.success("Loan disbursed.");
      setShowDisburseModal(false);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleDefault = async () => {
    if (!window.confirm("Mark this loan as defaulted?")) return;
    try {
      await defaultMutation.mutateAsync(id);
      toast.success("Loan marked as defaulted.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleAddGuarantor = async () => {
    if (!guarantorMemberId || !guarantorAmount) { toast.error("Select a member and enter an amount."); return; }
    try {
      await addGuarantorMutation.mutateAsync({ member_id: guarantorMemberId, guaranteed_amount: guarantorAmount });
      toast.success("Guarantor added.");
      setShowAddGuarantor(false);
      setGuarantorMemberId("");
      setGuarantorAmount("");
      setGuarantorSearch("");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await noteMutation.mutateAsync({ id, note: noteText });
      toast.success("Note added.");
      setNoteText("");
      setShowNoteForm(false);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error || !loan) return <p className="text-sm text-red-500">{extractApiError(error)}</p>;

  const isActive = loan.loan_status === "active" || loan.loan_status === "disbursed";
  const isPending = loan.approval_status === "pending";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">{loan.account_number}</h1>
          <p className="text-sm text-gray-500">{loan.member?.full_name ?? "—"} &middot; {loan.loan_product?.name ?? "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isPending && (
            <>
              {loan.loan_status === 'applied' ? (
                <button
                  disabled
                  title="Waiting for all guarantors to confirm."
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
                >
                  Approve
                </button>
              ) : (
                <button onClick={handleApprove} disabled={approveMutation.isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
                  Approve
                </button>
              )}
              <button onClick={() => setShowRejectModal(true)}
                className="rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                Reject
              </button>
            </>
          )}
          {loan.loan_status === "approved" && (
            <button onClick={() => setShowDisburseModal(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90">
              Disburse
            </button>
          )}
          {isActive && (
            <button onClick={handleDefault} disabled={defaultMutation.isPending}
              className="rounded-lg border border-orange-400 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-60">
              Mark Defaulted
            </button>
          )}
          {["draft","applied","rejected"].includes(loan.loan_status) && (
            <button onClick={async () => {
              if (!window.confirm("Archive this loan?")) return;
              await archiveMutation.mutateAsync(id);
              toast.success("Loan archived.");
              router.push("/admin/loans");
            }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Archive
            </button>
          )}
          <button onClick={() => setShowNoteForm(!showNoteForm)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            + Note
          </button>
          <Link href="/admin/loans" className="text-sm text-gray-500 hover:underline">← Back</Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { label: "Principal",    value: fmt(loan.principal_amount) },
          { label: "Outstanding",  value: fmt(loan.outstanding_balance) },
          { label: "Installment",  value: fmt(loan.repayment_amount) },
          { label: "Total Payable",value: fmt(loan.total_payable) },
          { label: "Rate",         value: `${loan.interest_rate}% p.a. / ${loan.loan_product?.interest_method ?? "—"}` },
          { label: "Period",       value: `${loan.repayment_period} months (${loan.repayment_frequency})` },
          { label: "Disbursed",    value: loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString("en-KE") : "—" },
          { label: "Maturity",     value: loan.expected_maturity_date ? new Date(loan.expected_maturity_date).toLocaleDateString("en-KE") : "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-medium text-dark dark:text-white text-sm">{value}</p>
          </div>
        ))}
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <LoanStatusBadge status={loan.loan_status} />
        </div>
      </div>

      {/* Guarantors */}
      {loan.guarantees.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-dark dark:text-white">Guarantors</h2>
            {["applied", "guarantors_confirmed"].includes(loan.loan_status) &&
              loan.guarantees.some((g) => g.approval_status === "rejected") && (
                <button
                  onClick={() => setShowAddGuarantor((v) => !v)}
                  className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                >
                  + Add Guarantor
                </button>
              )}
          </div>
          <div className="flex flex-col gap-2">
            {loan.guarantees.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <span>{g.member?.full_name ?? "—"} ({g.member?.member_number ?? "—"})</span>
                <span className="font-mono">{fmt(g.guaranteed_amount)}</span>
                <span className={
                  g.is_accepted
                    ? "text-green-600 font-medium"
                    : g.approval_status === "rejected"
                      ? "text-red-500 font-medium"
                      : "text-yellow-600"
                }>
                  {g.is_accepted ? "✓ Accepted" : g.approval_status === "rejected" ? "✕ Declined" : "⏱ Pending"}
                </span>
              </div>
            ))}
          </div>

          {showAddGuarantor && (
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700 flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Replacement Guarantor</p>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <SelectInput
                    options={guarantorMemberOptions}
                    value={guarantorMemberOptions.find((o) => o.value === guarantorMemberId) ?? null}
                    onChange={(opt) => setGuarantorMemberId((opt as { value: string } | null)?.value ?? "")}
                    onInputChange={(val) => setGuarantorSearch(val)}
                    placeholder="Search member…"
                  />
                </div>
                <div className="w-36">
                  <NumberInput
                    value={guarantorAmount}
                    onChange={(v) => setGuarantorAmount(v)}
                    placeholder="Amount"
                  />
                </div>
                <button
                  onClick={handleAddGuarantor}
                  disabled={addGuarantorMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
                >
                  {addGuarantorMutation.isPending ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collaterals */}
      {loan.collaterals.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 font-semibold text-dark dark:text-white">Collateral</h2>
          <div className="flex flex-col gap-2">
            {loan.collaterals.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <span>{c.collateral_type} {c.description ? `— ${c.description}` : ""}</span>
                <span className="font-mono">{fmt(c.estimated_value)}</span>
                <span className={c.is_received ? "text-green-600" : "text-gray-400"}>
                  {c.is_received ? "Received" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repayment schedule */}
      {loan.repayments.length > 0 && (
        <RepaymentScheduleTable loanId={id} data={loan.repayments} isActive={isActive} />
      )}

      {/* Notes */}
      {showNoteForm && (
        <form onSubmit={handleAddNote} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col gap-3">
          <h2 className="font-semibold">Add Note</h2>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            maxLength={2000}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          />
          <div className="flex gap-3">
            <button type="submit" disabled={noteMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60">
              Save Note
            </button>
            <button type="button" onClick={() => setShowNoteForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loan.notes.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 font-semibold text-dark dark:text-white">Notes</h2>
          <div className="flex flex-col gap-3">
            {loan.notes.map((n) => (
              <div key={n.id} className="border-b pb-3 last:border-0">
                <p className="text-xs text-gray-400 mb-1">{n.created_at ? new Date(n.created_at).toLocaleString("en-KE") : "—"}</p>
                <p className="text-sm">{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Reject Loan</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection…"
              required
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Cancel</button>
              <button onClick={handleReject} disabled={rejectMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {rejectMutation.isPending ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Disburse Loan</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Disbursement Account <span className="text-red-500">*</span>
                </label>
                <SelectInput
                  options={accountOptions}
                  value={accountOptions.find((o) => o.value === disburseAccountId) ?? null}
                  onChange={(opt) => setDisburseAccountId(opt?.value ?? "")}
                  onInputChange={(val) => setAccountSearch(val)}
                  placeholder="Search member account…"
                />
              </div>
              <DateInput
                label="Disbursement Date"
                value={disburseDate}
                onChange={(d) => setDisburseDate(d)}
                required
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowDisburseModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Cancel</button>
              <button onClick={handleDisburse} disabled={disburseMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60">
                {disburseMutation.isPending ? "Disbursing…" : "Disburse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
