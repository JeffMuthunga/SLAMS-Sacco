"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import {
  useReportTransactions, useReportIssues, useReportPettyCash,
  TransactionsReportParams, IssuesReportParams, PettyCashReportParams,
  TransactionsSummary, IssuesSummary, PettyCashSummary,
} from "@/lib/api/reports";
import { useIssueCategories } from "@/lib/api/issues";
import type { AccountTransaction } from "@/lib/api/accounts";
import type { Issue, IssuePriority, IssueStatus } from "@/lib/api/issues";
import type { PettyCashAllocation, PettyCashRequest } from "@/lib/api/petty-cash";

type Tab = "transactions" | "petty-cash" | "issues";

const TABS: { key: Tab; label: string }[] = [
  { key: "transactions", label: "Transactions" },
  { key: "petty-cash",   label: "Petty Cash" },
  { key: "issues",       label: "Issues" },
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

const CREDIT_TYPES = new Set(["deposit","interest_credit","transfer_in","loan_disbursement","contribution"]);

const TX_TYPE_OPTIONS = [
  "deposit","withdrawal","interest_credit","fee","transfer_in",
  "transfer_out","loan_disbursement","loan_repayment","contribution",
];

// ── Transactions ───────────────────────────────────────────────────────

function TransactionsReport() {
  const [params, setParams] = useState<TransactionsReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<TransactionsReportParams>({ per_page: 500 });

  const { data, isLoading } = useReportTransactions(params);
  const summary = data?.meta?.summary as TransactionsSummary | undefined;

  const columns = useMemo<ColumnDef<AccountTransaction>[]>(() => [
    { accessorKey: "transaction_date", header: "Date", cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-BW") },
    { accessorKey: "reference_number", header: "Reference", cell: ({ getValue }) => getValue<string>() ?? "—" },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ getValue }) => {
        const t = getValue<string>();
        const isCredit = CREDIT_TYPES.has(t);
        return (
          <span className={`capitalize ${isCredit ? "text-green-600" : "text-red-500"}`}>
            {t.replace(/_/g, " ")}
          </span>
        );
      },
    },
    { accessorKey: "narration", header: "Narration", cell: ({ getValue }) => getValue<string>() ?? "—" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const isCredit = CREDIT_TYPES.has(row.original.transaction_type);
        return (
          <span className={isCredit ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
            {isCredit ? "+" : "-"}{fmt(row.original.amount, true)}
          </span>
        );
      },
    },
    { accessorKey: "balance_after", header: "Balance After", cell: ({ getValue }) => fmt(getValue<string>(), true) },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Type</label>
          <select value={draft.transaction_type ?? ""} onChange={(e) => setDraft({ ...draft, transaction_type: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All Types</option>
            {TX_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
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
          <SummaryCard label="Total Transactions" value={summary.total} />
          <SummaryCard label="Total Credits"      value={fmt(summary.total_credit, true)} />
          <SummaryCard label="Total Debits"       value={fmt(summary.total_debit, true)} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Transactions Report" showExportButton />
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}

// ── Petty Cash ─────────────────────────────────────────────────────────

function PettyCashReport() {
  const [params, setParams] = useState<PettyCashReportParams>({});
  const [draft, setDraft]   = useState<PettyCashReportParams>({});

  const { data, isLoading } = useReportPettyCash(params);
  const summary = data?.summary as PettyCashSummary | undefined;

  const allocColumns = useMemo<ColumnDef<PettyCashAllocation>[]>(() => [
    { id: "period",           header: "Period",    cell: ({ row }) => (row.original.period as { name?: string } | null)?.name ?? "—" },
    { id: "user",             header: "Allocated To", cell: ({ row }) => (row.original.user as { name?: string } | null)?.name ?? "—" },
    { accessorKey: "amount",  header: "Amount",    cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "spent",   header: "Spent",     cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "balance", header: "Balance",   cell: ({ getValue }) => fmt(getValue<string>(), true) },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const cfg: Record<string, string> = { approved:"text-green-600", pending:"text-gray-500", rejected:"text-red-600" };
        return <span className={`capitalize font-medium ${cfg[v] ?? ""}`}>{v}</span>;
      },
    },
  ], []);

  const reqColumns = useMemo<ColumnDef<PettyCashRequest>[]>(() => [
    { id: "item",              header: "Item",      cell: ({ row }) => (row.original.item as { name?: string } | null)?.name ?? "—" },
    { id: "requester",         header: "Requester", cell: ({ row }) => (row.original.requester as { name?: string } | null)?.name ?? "—" },
    { accessorKey: "amount",   header: "Amount",    cell: ({ getValue }) => fmt(getValue<string>(), true) },
    { accessorKey: "expense_date", header: "Date", cell: ({ getValue }) => getValue<string>() ? new Date(getValue<string>()).toLocaleDateString("en-BW") : "—" },
    { accessorKey: "narration",    header: "Narration", cell: ({ getValue }) => getValue<string>() ?? "—" },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const cfg: Record<string, string> = { approved:"text-green-600", pending:"text-gray-500", rejected:"text-red-600" };
        return <span className={`capitalize font-medium ${cfg[v] ?? ""}`}>{v}</span>;
      },
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
            {["pending","approved","rejected"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <button onClick={() => setParams({ ...draft })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <SummaryCard label="Total Allocated" value={fmt(summary.total_allocated, true)} />
          <SummaryCard label="Total Spent"     value={fmt(summary.total_spent, true)} />
          <SummaryCard label="Total Requested" value={fmt(summary.total_requested, true)} />
          <SummaryCard label="Approved Amount" value={fmt(summary.approved_amount, true)} />
        </div>
      )}

      <DataTable columns={allocColumns} data={data?.allocations?.data ?? []} heading="Allocations" showExportButton />
      <DataTable columns={reqColumns}   data={data?.requests?.data ?? []}    heading="Requests"    showExportButton />
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}

// ── Issues ─────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<IssuePriority, { label: string; className: string }> = {
  low:    { label: "Low",    className: "" },
  medium: { label: "Medium", className: "text-blue-600" },
  high:   { label: "High",   className: "text-orange-600" },
  urgent: { label: "Urgent", className: "text-red-600" },
};
const STATUS_CFG: Record<IssueStatus, { label: string; className: string }> = {
  open:        { label: "Open",        className: "text-blue-600" },
  in_progress: { label: "In Progress", className: "text-yellow-600" },
  resolved:    { label: "Resolved",    className: "text-green-600" },
  closed:      { label: "Closed",      className: "text-gray-500" },
};

function IssuesReport() {
  const [params, setParams] = useState<IssuesReportParams>({ per_page: 500 });
  const [draft, setDraft]   = useState<IssuesReportParams>({ per_page: 500 });

  const { data, isLoading }       = useReportIssues(params);
  const { data: categories = [] } = useIssueCategories();
  const summary = data?.meta?.summary as IssuesSummary | undefined;

  const columns = useMemo<ColumnDef<Issue>[]>(() => [
    { accessorKey: "reference_number", header: "Reference", enableSorting: true },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ getValue }) => {
        const p = getValue<IssuePriority>();
        return <span className={`capitalize font-medium ${PRIORITY_CFG[p]?.className ?? ""}`}>{p}</span>;
      },
    },
    { accessorKey: "title",    header: "Title", cell: ({ getValue }) => { const v = getValue<string>(); return v.length > 50 ? v.slice(0,50)+"…" : v; } },
    { id: "category",          header: "Category", cell: ({ row }) => row.original.category?.name ?? "—" },
    { id: "member",            header: "Member",   cell: ({ row }) => row.original.member?.full_name ?? "—" },
    { id: "assignee",          header: "Assigned", cell: ({ row }) => row.original.assignee?.name ?? "—" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const s = getValue<IssueStatus>();
        return <span className={`capitalize font-medium ${STATUS_CFG[s]?.className ?? ""}`}>{s.replace(/_/g," ")}</span>;
      },
    },
    { accessorKey: "created_at", header: "Opened", cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("en-BW") },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select value={draft.status ?? ""} onChange={(e) => setDraft({ ...draft, status: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {(["open","in_progress","resolved","closed"] as IssueStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CFG[s].label || s.replace(/_/g," ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Priority</label>
          <select value={draft.priority ?? ""} onChange={(e) => setDraft({ ...draft, priority: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {(["urgent","high","medium","low"] as IssuePriority[]).map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Category</label>
          <select value={draft.category_id ?? ""} onChange={(e) => setDraft({ ...draft, category_id: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark">
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">From</label>
          <input type="date" value={draft.created_from ?? ""} onChange={(e) => setDraft({ ...draft, created_from: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">To</label>
          <input type="date" value={draft.created_to ?? ""} onChange={(e) => setDraft({ ...draft, created_to: e.target.value || undefined })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-dark" />
        </div>
        <button onClick={() => setParams({ ...draft })}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90">
          Generate
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <SummaryCard label="Total Issues" value={summary.total} />
          <SummaryCard label="Open"         value={summary.open} />
          <SummaryCard label="Resolved"     value={summary.resolved} />
          <SummaryCard label="Closed"       value={summary.closed} />
        </div>
      )}

      <DataTable columns={columns} data={data?.data ?? []} heading="Issues Report" showExportButton />
      {isLoading && <p className="text-center text-sm text-gray-500">Loading…</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function OperationsReportsPage() {
  const [tab, setTab] = useState<Tab>("transactions");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Operations Reports</h1>

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

      {tab === "transactions" && <TransactionsReport />}
      {tab === "petty-cash"   && <PettyCashReport />}
      {tab === "issues"       && <IssuesReport />}
    </div>
  );
}
