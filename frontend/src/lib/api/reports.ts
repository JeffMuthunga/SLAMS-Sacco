import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Member } from "./members";
import type { Loan } from "./loans";
import type { Contribution } from "./contributions";
import type { DepositAccount, AccountTransaction } from "./accounts";
import type { Issue } from "./issues";
import type { PettyCashAllocation, PettyCashRequest } from "./petty-cash";

// ── Meta types ────────────────────────────────────────────────────────

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MembersSummary { total: number; active: number; inactive: number }
export interface LoansSummary { total: number; active: number; total_principal: string; total_outstanding: string }
export interface ContributionsSummary { total: number; paid: number; pending: number; total_expected: string; total_paid: string }
export interface AccountsSummary { total: number; active: number; total_balance: string }
export interface TransactionsSummary { total: number; total_credit: string; total_debit: string }
export interface IssuesSummary { total: number; open: number; resolved: number; closed: number }
export interface PettyCashSummary { total_allocated: string; total_spent: string; total_requested: string; approved_amount: string }

export interface ReportResult<T, S> {
  data: T[];
  meta: PageMeta & { summary: S };
}

export interface PettyCashReportResult {
  data: {
    allocations: { data: PettyCashAllocation[]; meta: PageMeta };
    requests:    { data: PettyCashRequest[];    meta: PageMeta };
    summary:     PettyCashSummary;
  };
}

// ── Params ────────────────────────────────────────────────────────────

export interface MembersReportParams {
  approval_status?: string; is_active?: string; gender?: string;
  entry_from?: string; entry_to?: string; search?: string; per_page?: number;
}

export interface LoansReportParams {
  loan_status?: string; loan_product_id?: string;
  disbursed_from?: string; disbursed_to?: string;
  applied_from?: string; applied_to?: string;
  search?: string; per_page?: number;
}

export interface ContributionsReportParams {
  fiscal_year_id?: string; period_id?: string; status?: string;
  due_from?: string; due_to?: string; member_id?: string; per_page?: number;
}

export interface AccountsReportParams {
  product_id?: string; approval_status?: string; is_active?: string;
  opening_from?: string; opening_to?: string; per_page?: number;
}

export interface TransactionsReportParams {
  transaction_type?: string; deposit_account_id?: string;
  from_date?: string; to_date?: string; per_page?: number;
}

export interface IssuesReportParams {
  status?: string; priority?: string; category_id?: string;
  created_from?: string; created_to?: string; per_page?: number;
}

export interface PettyCashReportParams {
  period_id?: string; approval_status?: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────

export function useReportMembers(params?: MembersReportParams, enabled = true) {
  return useQuery<ReportResult<Member, MembersSummary>>({
    queryKey: ["reports", "members", params],
    queryFn: async () => {
      const { data } = await api.get("/reports/members", { params });
      return data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useReportLoans(params?: LoansReportParams, enabled = true) {
  return useQuery<ReportResult<Loan, LoansSummary>>({
    queryKey: ["reports", "loans", params],
    queryFn: async () => {
      const { data } = await api.get("/reports/loans", { params });
      return data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useReportContributions(params?: ContributionsReportParams, enabled = true) {
  return useQuery<ReportResult<Contribution, ContributionsSummary>>({
    queryKey: ["reports", "contributions", params],
    queryFn: async () => {
      const { data } = await api.get("/reports/contributions", { params });
      return data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useReportAccounts(params?: AccountsReportParams, enabled = true) {
  return useQuery<ReportResult<DepositAccount, AccountsSummary>>({
    queryKey: ["reports", "accounts", params],
    queryFn: async () => {
      const { data } = await api.get("/reports/accounts", { params });
      return data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useReportTransactions(params?: TransactionsReportParams, enabled = true) {
  return useQuery<ReportResult<AccountTransaction, TransactionsSummary>>({
    queryKey: ["reports", "transactions", params],
    queryFn: async () => {
      const { data } = await api.get("/reports/transactions", { params });
      return data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useReportIssues(params?: IssuesReportParams, enabled = true) {
  return useQuery<ReportResult<Issue, IssuesSummary>>({
    queryKey: ["reports", "issues", params],
    queryFn: async () => {
      const { data } = await api.get("/reports/issues", { params });
      return data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useReportPettyCash(params?: PettyCashReportParams, enabled = true) {
  return useQuery<PettyCashReportResult["data"]>({
    queryKey: ["reports", "petty-cash", params],
    queryFn: async () => {
      const { data } = await api.get("/reports/petty-cash", { params });
      return data.data;
    },
    staleTime: 30_000,
    enabled,
  });
}
