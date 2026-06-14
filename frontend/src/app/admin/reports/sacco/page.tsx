"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import {
  useReportMembers, useReportLoans, useReportContributions, useReportAccounts,
  MembersReportParams, LoansReportParams, ContributionsReportParams, AccountsReportParams,
  MembersSummary, LoansSummary, ContributionsSummary, AccountsSummary,
} from "@/lib/api/reports";
import { useLoanProducts, useSavingProducts, useFiscalYears, usePeriods } from "@/lib/api/configurations";
import type { Member } from "@/lib/api/members";
import type { Loan, LoanStatus } from "@/lib/api/loans";
import type { Contribution, ContributionStatus } from "@/lib/api/contributions";
import type { DepositAccount } from "@/lib/api/accounts";

type Tab = "members" | "loans" | "contributions" | "accounts";

const TABS: { key: Tab; label: string }[] = [
  { key: "members",       label: "Members" },
  { key: "loans",         label: "Loans" },
  { key: "contributions", label: "Contributions" },
  { key: "accounts",      label: "Savings Accounts" },
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

// ── Members ────────────────────────────────────────────────────────────

function MembersReport() {
  const [params, setParams] = useState<MembersReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<MembersReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportMembers(params);
  const summary = data?.meta?.summary as MembersSummary | undefined;

  const columns = useMemo<ColumnDef<Member>[]>(() => [
    { accessorKey: "member_number", header: "Member #", enableSorting: true },
    { accessorKey: "full_name",     header: "Full Name",  enableSorting: true },
    { accessorKey: "id_number",     header: "ID Number" },
    { accessorKey: "phone",         header: "Phone" },
    { accessorKey: "email",         header: "Email", cell: ({ getValue }) => getValue<string>() ?? "—" },
    { accessorKey: "gender",        header: "Gender",  cell: ({ getValue }) => getValue<string>() ?? "—" },
    { accessorKey: "entry_date",    header: "Entry Date" },
    {
      accessorKey: "approval_status",
      header: "Approval",
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

  const apply = () => setParams({ ...draft });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Approval Status</label>
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
            {["male","female","other"].map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Entry From</label>
          <input type="date" value={draft.entry_from ?? ""} onChange={(e) => setDraft({ ...draft, entry_from: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Entry To</label>
          <input type="date" value={draft.entry_to ?? ""} onChange={(e) => setDraft({ ...draft, entry_to: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={apply}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total Members"    value={summary.total} />
          <SummaryCard label="Active Members"   value={summary.active} />
          <SummaryCard label="Inactive Members" value={summary.inactive} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Members Report" showExportButton />
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
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
    draft:"Draft",applied:"Applied",guarantors_confirmed:"Guarantors Confirmed",
    approved:"Approved",rejected:"Rejected",
    disbursed:"Disbursed",active:"Active",repaid:"Repaid",defaulted:"Defaulted",
  };

  const columns = useMemo<ColumnDef<Loan>[]>(() => [
    { accessorKey: "account_number",  header: "Account #", enableSorting: true },
    { id: "member",                   header: "Member",    cell: ({ row }) => row.original.member?.full_name ?? "—" },
    { id: "product",                  header: "Product",   cell: ({ row }) => (row.original.loan_product as { name?: string } | null)?.name ?? "—" },
    { accessorKey: "principal_amount",header: "Principal", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "outstanding_balance", header: "Outstanding", cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "interest_rate",   header: "Rate %",   cell: ({ getValue }) => `${getValue<string>()}%` },
    { accessorKey: "loan_status",     header: "Status",   cell: ({ getValue }) => STATUS_LABELS[getValue<LoanStatus>()] ?? getValue<string>() },
    { accessorKey: "disbursed_date",  header: "Disbursed",cell: ({ getValue }) => getValue<string>() ? new Date(getValue<string>()).toLocaleDateString("en-BW") : "—" },
    { accessorKey: "maturity_date",   header: "Maturity", cell: ({ getValue }) => getValue<string>() ? new Date(getValue<string>()).toLocaleDateString("en-BW") : "—" },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.loan_status ?? ""} onChange={(e) => setDraft({ ...draft, loan_status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s as LoanStatus]}</option>)}
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
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <SummaryCard label="Total Loans"        value={summary.total} />
          <SummaryCard label="Active/Disbursed"   value={summary.active} />
          <SummaryCard label="Total Principal"    value={fmt(summary.total_principal, true)} />
          <SummaryCard label="Total Outstanding"  value={fmt(summary.total_outstanding, true)} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Loans Report" showExportButton />
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}

// ── Contributions ──────────────────────────────────────────────────────

function ContributionsReport() {
  const [params, setParams] = useState<ContributionsReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<ContributionsReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportContributions(params);
  const summary = data?.meta?.summary as ContributionsSummary | undefined;

  const { data: fiscalYears = [] }               = useFiscalYears();
  const [fyId, setFyId]                           = useState("");
  const { data: periods = [] }                    = usePeriods(fyId);

  const STATUS_CFG: Record<ContributionStatus, string> = {
    pending:"text-gray-600", partial:"text-yellow-600", paid:"text-green-600", waived:"text-blue-600",
  };

  const columns = useMemo<ColumnDef<Contribution>[]>(() => [
    { id: "member",            header: "Member",   cell: ({ row }) => row.original.member?.full_name ?? "—" },
    { id: "member_number",     header: "Memb. #",  cell: ({ row }) => row.original.member?.member_number ?? "—" },
    { id: "period",            header: "Period",   cell: ({ row }) => row.original.period?.name ?? "—" },
    { accessorKey: "due_date", header: "Due Date", cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-BW") },
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
    { accessorKey: "paid_date", header: "Paid Date", cell: ({ getValue }) => getValue<string>() ? new Date(getValue<string>()).toLocaleDateString("en-BW") : "—" },
  ], []);

  const apply = () => setParams({ ...draft, fiscal_year_id: fyId || undefined });

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
        <button onClick={apply}
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
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
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
    { accessorKey: "account_number", header: "Account #", enableSorting: true },
    { id: "member",                  header: "Member",    cell: ({ row }) => row.original.member?.full_name ?? "—" },
    { id: "product",                 header: "Product",   cell: ({ row }) => (row.original.product as { name?: string } | null)?.name ?? "—" },
    { accessorKey: "balance",        header: "Balance",   cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "interest_rate",  header: "Rate %",   cell: ({ getValue }) => `${getValue<string>()}%` },
    { accessorKey: "opening_date",   header: "Opened",   cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-BW") },
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
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function SaccoReportsPage() {
  const [tab, setTab] = useState<Tab>("members");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">SACCO Reports</h1>

      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-dark w-fit">
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

      {tab === "members"       && <MembersReport />}
      {tab === "loans"         && <LoansReport />}
      {tab === "contributions" && <ContributionsReport />}
      {tab === "accounts"      && <AccountsReport />}
    </div>
  );
}
