"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import {
  useReportMembers, useReportLoans, useReportContributions, useReportAccounts,
  useReportLoanRepayments, useReportShares, useReportDividends,
  MembersReportParams, LoansReportParams, ContributionsReportParams, AccountsReportParams,
  LoanRepaymentsReportParams, SharesReportParams, DividendsReportParams,
  MembersSummary, LoansSummary, ContributionsSummary, AccountsSummary,
  LoanRepaymentsSummary, SharesSummary,
  LoanRepaymentRow, ShareRow, DividendEntryRow, DividendRun,
} from "@/lib/api/reports";
import { useLoanProducts, useSavingProducts, useFiscalYears, usePeriods } from "@/lib/api/configurations";
import { useShareProducts } from "@/lib/api/shares";
import type { Member } from "@/lib/api/members";
import type { Loan, LoanStatus } from "@/lib/api/loans";
import type { Contribution, ContributionStatus } from "@/lib/api/contributions";
import type { DepositAccount } from "@/lib/api/accounts";

type Tab = "members" | "loans" | "loan-repayments" | "contributions" | "accounts" | "shares" | "dividends";

const TABS: { key: Tab; label: string }[] = [
  { key: "members",          label: "Members" },
  { key: "loans",            label: "Loans" },
  { key: "loan-repayments",  label: "Loan Repayments" },
  { key: "contributions",    label: "Contributions" },
  { key: "accounts",         label: "Savings Accounts" },
  { key: "shares",           label: "Shares" },
  { key: "dividends",        label: "Dividends" },
];

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-dark dark:text-white">{value}</p>
    </div>
  );
}

function fmt(v: string | number | null | undefined, currency = false): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return currency ? `BWP ${n.toLocaleString("en-BW", { minimumFractionDigits: 2 })}` : n.toLocaleString("en-BW");
}

function fmtDate(v: string | null | undefined) {
  return v ? new Date(v).toLocaleDateString("en-BW") : "—";
}

// ── Members ────────────────────────────────────────────────────────────

function MembersReport() {
  const [params, setParams] = useState<MembersReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<MembersReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportMembers(params);
  const summary = data?.meta?.summary as MembersSummary | undefined;

  const columns = useMemo<ColumnDef<Member>[]>(() => [
    { accessorKey: "member_number", header: "Member #",   enableSorting: true },
    { accessorKey: "full_name",     header: "Full Name",  enableSorting: true },
    { accessorKey: "id_number",     header: "ID Number" },
    { accessorKey: "gender",        header: "Gender",     cell: ({ getValue }) => getValue<string>() ?? "—" },
    { accessorKey: "date_of_birth", header: "Date of Birth", cell: ({ getValue }) => fmtDate(getValue<string>()) },
    {
      id: "age",
      header: "Age",
      cell: ({ row }) => {
        const dob = row.original.date_of_birth;
        if (!dob) return "—";
        const diff = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        return diff;
      },
    },
    { accessorKey: "entry_date",    header: "Joined",     cell: ({ getValue }) => fmtDate(getValue<string>()) },
    { accessorKey: "phone",         header: "Phone" },
    { accessorKey: "email",         header: "Email",      cell: ({ getValue }) => getValue<string>() ?? "—" },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const cfg: Record<string, string> = { approved: "text-green-600", pending: "text-yellow-600", rejected: "text-red-600", draft: "text-gray-500" };
        return <span className={`font-medium capitalize ${cfg[v] ?? ""}`}>{v}</span>;
      },
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ getValue }) => getValue<boolean>() ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>,
    },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.approval_status ?? ""} onChange={(e) => setDraft({ ...draft, approval_status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {["approved","pending","rejected","draft"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Active</label>
          <select value={draft.is_active ?? ""} onChange={(e) => setDraft({ ...draft, is_active: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Gender</label>
          <select value={draft.gender ?? ""} onChange={(e) => setDraft({ ...draft, gender: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {["M","F"].map((g) => <option key={g} value={g}>{g === "M" ? "Male" : "Female"}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Joined From</label>
          <input type="date" value={draft.entry_from ?? ""} onChange={(e) => setDraft({ ...draft, entry_from: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Joined To</label>
          <input type="date" value={draft.entry_to ?? ""} onChange={(e) => setDraft({ ...draft, entry_to: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={() => setParams({ ...draft })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total Members"    value={summary.total} />
          <SummaryCard label="Active Members"   value={summary.active} />
          <SummaryCard label="Inactive Members" value={summary.inactive} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Members Register" showExportButton />
    </div>
  );
}

// ── Loans ──────────────────────────────────────────────────────────────

function LoansReport() {
  const [params, setParams] = useState<LoansReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<LoansReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportLoans(params);
  const summary = data?.meta?.summary as LoansSummary | undefined;
  const { data: products = [] } = useLoanProducts();

  const STATUS_LABELS: Record<LoanStatus, string> = {
    draft:"Draft", applied:"Applied", guarantors_confirmed:"Guarantors Confirmed",
    approved:"Approved", rejected:"Rejected",
    disbursed:"Disbursed", active:"Active", repaid:"Repaid", defaulted:"Defaulted",
  };

  const columns = useMemo<ColumnDef<Loan>[]>(() => [
    { accessorKey: "account_number",      header: "Account #", enableSorting: true },
    { id: "member",                        header: "Member",    cell: ({ row }) => row.original.member?.full_name ?? "—" },
    { id: "member_number",                 header: "Memb. #",   cell: ({ row }) => row.original.member?.member_number ?? "—" },
    { id: "product",                       header: "Product",   cell: ({ row }) => (row.original.loan_product as { name?: string } | null)?.name ?? "—" },
    { accessorKey: "principal_amount",     header: "Principal", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "outstanding_balance",  header: "Outstanding", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "interest_rate",        header: "Rate %",    cell: ({ getValue }) => `${getValue<string>()}%` },
    { accessorKey: "repayment_period",     header: "Months" },
    { accessorKey: "loan_status",          header: "Status",
      cell: ({ getValue }) => {
        const v = getValue<LoanStatus>();
        const cfg: Record<string, string> = { active:"text-green-600", repaid:"text-blue-600", defaulted:"text-red-600", approved:"text-yellow-600" };
        return <span className={`capitalize font-medium ${cfg[v] ?? "text-gray-600"}`}>{STATUS_LABELS[v] ?? v}</span>;
      }
    },
    { accessorKey: "disbursed_date",       header: "Disbursed", cell: ({ getValue }) => fmtDate(getValue<string>()) },
    { accessorKey: "expected_maturity_date", header: "Maturity", cell: ({ getValue }) => fmtDate(getValue<string>()) },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.loan_status ?? ""} onChange={(e) => setDraft({ ...draft, loan_status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Product</label>
          <select value={draft.loan_product_id ?? ""} onChange={(e) => setDraft({ ...draft, loan_product_id: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Applied From</label>
          <input type="date" value={draft.applied_from ?? ""} onChange={(e) => setDraft({ ...draft, applied_from: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Applied To</label>
          <input type="date" value={draft.applied_to ?? ""} onChange={(e) => setDraft({ ...draft, applied_to: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={() => setParams({ ...draft })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
        <button onClick={() => { const d = { loan_status: "defaulted", per_page: 500 }; setDraft(d); setParams(d); }}
          className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
          Defaulters Only
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <SummaryCard label="Total Loans"       value={summary.total} />
          <SummaryCard label="Active/Disbursed"  value={summary.active} />
          <SummaryCard label="Total Principal"   value={fmt(summary.total_principal, true)} />
          <SummaryCard label="Total Outstanding" value={fmt(summary.total_outstanding, true)} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Loans Report" showExportButton />
    </div>
  );
}

// ── Loan Repayments ────────────────────────────────────────────────────

function LoanRepaymentsReport() {
  const [params, setParams] = useState<LoanRepaymentsReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<LoanRepaymentsReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportLoanRepayments(params);
  const summary = data?.meta?.summary as LoanRepaymentsSummary | undefined;
  const { data: products = [] } = useLoanProducts();

  const STATUS_CFG: Record<string, string> = {
    paid: "text-green-600", partial: "text-yellow-600", pending: "text-gray-500", overdue: "text-red-600",
  };

  const columns = useMemo<ColumnDef<LoanRepaymentRow>[]>(() => [
    { accessorKey: "member_name",    header: "Member",     enableSorting: true },
    { accessorKey: "member_number",  header: "Memb. #" },
    { accessorKey: "loan_account",   header: "Loan Acct" },
    { accessorKey: "loan_product",   header: "Product" },
    { accessorKey: "due_date",       header: "Due Date",   cell: ({ getValue }) => fmtDate(getValue<string>()) },
    { accessorKey: "paid_date",      header: "Paid Date",  cell: ({ getValue }) => fmtDate(getValue<string>()) },
    { accessorKey: "principal_due",  header: "Princ. Due", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "interest_due",   header: "Int. Due",   cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "total_due",      header: "Total Due",  cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "total_paid",     header: "Total Paid", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "balance",        header: "Balance",    cell: ({ getValue }) => fmt(getValue<string>(), true) },
    {
      accessorKey: "repayment_status",
      header: "Status",
      cell: ({ getValue, row }) => {
        const s = getValue<string>();
        const isOverdue = s !== "paid" && row.original.due_date && new Date(row.original.due_date) < new Date();
        const label = isOverdue ? "Overdue" : s.charAt(0).toUpperCase() + s.slice(1);
        const cls = isOverdue ? "text-red-600" : (STATUS_CFG[s] ?? "");
        return <span className={`font-medium ${cls}`}>{label}</span>;
      },
    },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.repayment_status ?? ""} onChange={(e) => setDraft({ ...draft, repayment_status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {["paid","partial","pending"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Product</label>
          <select value={draft.loan_product_id ?? ""} onChange={(e) => setDraft({ ...draft, loan_product_id: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Due From</label>
          <input type="date" value={draft.due_from ?? ""} onChange={(e) => setDraft({ ...draft, due_from: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Due To</label>
          <input type="date" value={draft.due_to ?? ""} onChange={(e) => setDraft({ ...draft, due_to: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={() => setParams({ ...draft })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
        <button onClick={() => { const d = { overdue: true as const, per_page: 500 }; setDraft(d); setParams(d); }}
          className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
          Overdue Only
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-5 gap-3">
          <SummaryCard label="Total Instalments" value={summary.total} />
          <SummaryCard label="Overdue"           value={summary.overdue} />
          <SummaryCard label="Total Due"         value={fmt(summary.total_due, true)} />
          <SummaryCard label="Total Paid"        value={fmt(summary.total_paid, true)} />
          <SummaryCard label="Outstanding"       value={fmt(summary.total_balance, true)} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Loan Repayments" showExportButton />
    </div>
  );
}

// ── Contributions ──────────────────────────────────────────────────────

function ContributionsReport() {
  const [params, setParams] = useState<ContributionsReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<ContributionsReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportContributions(params);
  const summary = data?.meta?.summary as ContributionsSummary | undefined;

  const { data: fiscalYears = [] } = useFiscalYears();
  const [fyId, setFyId]            = useState("");
  const { data: periods = [] }     = usePeriods(fyId);

  const STATUS_CFG: Record<ContributionStatus, string> = {
    pending:"text-gray-600", partial:"text-yellow-600", paid:"text-green-600", waived:"text-blue-600",
  };

  const columns = useMemo<ColumnDef<Contribution>[]>(() => [
    { id: "member",            header: "Member",   cell: ({ row }) => row.original.member?.full_name ?? "—" },
    { id: "member_number",     header: "Memb. #",  cell: ({ row }) => row.original.member?.member_number ?? "—" },
    { id: "period",            header: "Period",   cell: ({ row }) => row.original.period?.name ?? "—" },
    { accessorKey: "due_date", header: "Due Date", cell: ({ getValue }) => fmtDate(getValue<string>()) },
    { accessorKey: "expected_amount", header: "Expected", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "paid_amount",     header: "Paid",     cell: ({ getValue }) => fmt(getValue<string>(), true) },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const s = getValue<ContributionStatus>();
        return <span className={`capitalize font-medium ${STATUS_CFG[s] ?? ""}`}>{s}</span>;
      },
    },
    { accessorKey: "paid_date", header: "Paid Date", cell: ({ getValue }) => fmtDate(getValue<string>()) },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Fiscal Year</label>
          <select value={fyId} onChange={(e) => { setFyId(e.target.value); setDraft({ ...draft, period_id: undefined }); }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {fiscalYears.map((fy) => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Period</label>
          <select value={draft.period_id ?? ""} onChange={(e) => setDraft({ ...draft, period_id: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" disabled={!fyId}>
            <option value="">All</option>
            {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.status ?? ""} onChange={(e) => setDraft({ ...draft, status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {["pending","partial","paid","waived"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Due From</label>
          <input type="date" value={draft.due_from ?? ""} onChange={(e) => setDraft({ ...draft, due_from: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Due To</label>
          <input type="date" value={draft.due_to ?? ""} onChange={(e) => setDraft({ ...draft, due_to: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={() => setParams({ ...draft, fiscal_year_id: fyId || undefined })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-5 gap-3">
          <SummaryCard label="Total Records" value={summary.total} />
          <SummaryCard label="Paid"          value={summary.paid} />
          <SummaryCard label="Pending"       value={summary.pending} />
          <SummaryCard label="Expected"      value={fmt(summary.total_expected, true)} />
          <SummaryCard label="Collected"     value={fmt(summary.total_paid, true)} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Contributions Report" showExportButton />
    </div>
  );
}

// ── Savings Accounts ───────────────────────────────────────────────────

function AccountsReport() {
  const [params, setParams] = useState<AccountsReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<AccountsReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportAccounts(params);
  const summary = data?.meta?.summary as AccountsSummary | undefined;
  const { data: products = [] } = useSavingProducts();

  const columns = useMemo<ColumnDef<DepositAccount>[]>(() => [
    { accessorKey: "account_number", header: "Account #",  enableSorting: true },
    { id: "member",                  header: "Member",     cell: ({ row }) => row.original.member?.full_name ?? "—" },
    { id: "member_number",           header: "Memb. #",    cell: ({ row }) => row.original.member?.member_number ?? "—" },
    { id: "product",                 header: "Product",    cell: ({ row }) => (row.original.product as { name?: string } | null)?.name ?? "—" },
    { accessorKey: "balance",        header: "Balance",    cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "interest_rate",  header: "Rate %",     cell: ({ getValue }) => `${getValue<string>()}%` },
    { accessorKey: "opening_date",   header: "Opened",     cell: ({ getValue }) => fmtDate(getValue<string>()) },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const cfg: Record<string, string> = { approved: "text-green-600", pending: "text-yellow-600", rejected: "text-red-600" };
        return <span className={`capitalize font-medium ${cfg[v] ?? ""}`}>{v}</span>;
      },
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ getValue }) => getValue<boolean>() ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>,
    },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Product</label>
          <select value={draft.product_id ?? ""} onChange={(e) => setDraft({ ...draft, product_id: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.approval_status ?? ""} onChange={(e) => setDraft({ ...draft, approval_status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {["approved","pending","rejected"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Active</label>
          <select value={draft.is_active ?? ""} onChange={(e) => setDraft({ ...draft, is_active: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Opened From</label>
          <input type="date" value={draft.opening_from ?? ""} onChange={(e) => setDraft({ ...draft, opening_from: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Opened To</label>
          <input type="date" value={draft.opening_to ?? ""} onChange={(e) => setDraft({ ...draft, opening_to: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={() => setParams({ ...draft })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total Accounts"  value={summary.total} />
          <SummaryCard label="Active Accounts" value={summary.active} />
          <SummaryCard label="Total Balance"   value={fmt(summary.total_balance, true)} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Savings Accounts Report" showExportButton />
    </div>
  );
}

// ── Shares ────────────────────────────────────────────────────────────

function SharesReport() {
  const [params, setParams] = useState<SharesReportParams>({ status: "approved", per_page: 500 });
  const [draft, setDraft]   = useState<SharesReportParams>({ status: "approved", per_page: 500 });

  const { data, isLoading } = useReportShares(params);
  const summary = data?.meta?.summary as SharesSummary | undefined;
  const { data: products = [] } = useShareProducts();

  const columns = useMemo<ColumnDef<ShareRow>[]>(() => [
    { accessorKey: "member_number",  header: "Memb. #",      enableSorting: true },
    { accessorKey: "member_name",    header: "Member" },
    { accessorKey: "product_name",   header: "Share Type" },
    { accessorKey: "quantity",       header: "Shares",        cell: ({ getValue }) => fmt(getValue<number>()) },
    { accessorKey: "price_per_share",header: "Price/Share",   cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "total_amount",   header: "Total Value",   cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "purchase_date",  header: "Purchase Date", cell: ({ getValue }) => fmtDate(getValue<string>()) },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const cfg: Record<string, string> = { approved: "text-green-600", pending: "text-yellow-600", rejected: "text-red-600" };
        return <span className={`capitalize font-medium ${cfg[v] ?? ""}`}>{v}</span>;
      },
    },
    { accessorKey: "notes", header: "Notes", cell: ({ getValue }) => getValue<string>() ?? "—" },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Share Type</label>
          <select value={draft.share_product_id ?? ""} onChange={(e) => setDraft({ ...draft, share_product_id: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All Types</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.status ?? ""} onChange={(e) => setDraft({ ...draft, status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {["approved","pending","rejected"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">From</label>
          <input type="date" value={draft.from_date ?? ""} onChange={(e) => setDraft({ ...draft, from_date: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">To</label>
          <input type="date" value={draft.to_date ?? ""} onChange={(e) => setDraft({ ...draft, to_date: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={() => setParams({ ...draft })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Records"      value={summary.total} />
          <SummaryCard label="Total Shares" value={fmt(summary.total_shares)} />
          <SummaryCard label="Total Value"  value={fmt(summary.total_value, true)} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Shares Register" showExportButton />
    </div>
  );
}

// ── Dividends ─────────────────────────────────────────────────────────

function DividendsReport() {
  const [params, setParams] = useState<DividendsReportParams>({});
  const [draft, setDraft]   = useState<DividendsReportParams>({});
  const [selectedRunId, setSelectedRunId] = useState("");

  const { data: fiscalYears = [] } = useFiscalYears();
  const { data, isLoading }        = useReportDividends({ ...params, dividend_run_id: selectedRunId || undefined });

  const runs    = data?.runs ?? [];
  const entries = data?.entries?.data ?? [];
  const entrySummary = data?.entries?.meta?.summary;

  const runColumns = useMemo<ColumnDef<DividendRun>[]>(() => [
    { accessorKey: "fiscal_year", header: "Fiscal Year", cell: ({ getValue }) => getValue<string>() ?? "—" },
    { accessorKey: "rate",           header: "Rate",           cell: ({ getValue }) => `${(Number(getValue<string>()) * 100).toFixed(1)}%` },
    { accessorKey: "total_dividend", header: "Total Dividend", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const cfg: Record<string, string> = { posted: "text-green-600", draft: "text-gray-500", approved: "text-blue-600" };
        return <span className={`capitalize font-medium ${cfg[v] ?? ""}`}>{v}</span>;
      },
    },
    { accessorKey: "approved_at", header: "Approved", cell: ({ getValue }) => fmtDate(getValue<string>()) },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedRunId(row.original.id === selectedRunId ? "" : row.original.id)}
          className={`rounded px-2 py-0.5 text-xs font-medium ${row.original.id === selectedRunId ? "bg-primary text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
        >
          {row.original.id === selectedRunId ? "Selected" : "View Entries"}
        </button>
      ),
    },
  ], [selectedRunId]);

  const entryColumns = useMemo<ColumnDef<DividendEntryRow>[]>(() => [
    { accessorKey: "member_number",  header: "Memb. #",       enableSorting: true },
    { accessorKey: "member_name",    header: "Member" },
    { accessorKey: "fiscal_year",    header: "Fiscal Year" },
    { accessorKey: "run_rate",       header: "Rate",           cell: ({ getValue }) => `${(Number(getValue<string>()) * 100).toFixed(1)}%` },
    { accessorKey: "share_balance",  header: "Share Capital",  cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "dividend_amount",header: "Dividend",       cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "account_number", header: "Credited To",    cell: ({ getValue }) => getValue<string>() ?? "—" },
    { accessorKey: "posted_at",      header: "Posted",         cell: ({ getValue }) => fmtDate(getValue<string>()) },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Fiscal Year</label>
          <select value={draft.fiscal_year_id ?? ""} onChange={(e) => setDraft({ ...draft, fiscal_year_id: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {fiscalYears.map((fy) => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.status ?? ""} onChange={(e) => setDraft({ ...draft, status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {["draft","approved","posted"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <button onClick={() => { setParams({ ...draft }); setSelectedRunId(""); }}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      <DataTable columns={runColumns} data={runs} heading="Dividend Runs" />

      {entrySummary && (
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="Member Entries"  value={entrySummary.total} />
          <SummaryCard label="Total Dividends" value={fmt(entrySummary.total_dividend, true)} />
        </div>
      )}

      <DataTable
        columns={entryColumns}
        data={entries}
        heading={selectedRunId ? "Dividend Entries — Selected Run" : "All Dividend Entries"}
        showExportButton
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function SaccoReportsPage() {
  const [tab, setTab] = useState<Tab>("members");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">SACCO Reports</h1>

      <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-dark w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "members"         && <MembersReport />}
      {tab === "loans"           && <LoansReport />}
      {tab === "loan-repayments" && <LoanRepaymentsReport />}
      {tab === "contributions"   && <ContributionsReport />}
      {tab === "accounts"        && <AccountsReport />}
      {tab === "shares"          && <SharesReport />}
      {tab === "dividends"       && <DividendsReport />}
    </div>
  );
}
