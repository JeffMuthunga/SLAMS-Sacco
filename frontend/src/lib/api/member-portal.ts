import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";
import type { Member } from "./members";
import type { DepositAccount, AccountTransaction } from "./accounts";
import type { Loan } from "./loans";
import type { Contribution } from "./contributions";
import type { Issue, IssueCategory, IssueComment } from "./issues";
import type { PettyCashAllocation, PettyCashRequest } from "./petty-cash";
import type { LoanProduct } from "./configurations";

// ── Types ──────────────────────────────────────────────────────────────

export interface MemberDashboard {
  total_balance: string;
  active_loans: number;
  outstanding_loan_balance: string;
  pending_contributions: number;
}

export interface Guarantee {
  id: string;
  guaranteed_amount: string;
  is_accepted: boolean;
  accepted_at: string | null;
  is_active: boolean;
  approval_status: string;
  created_at: string;
  loan: {
    id: string;
    account_number: string;
    principal_amount: string;
    loan_status: string;
    member: { id: string; full_name: string; member_number: string } | null;
    loan_product: { id: string; name: string } | null;
  } | null;
}

export interface GuaranteesResponse {
  data: Guarantee[];
  meta: ApiMeta;
}

export interface TransactionsResponse {
  data: AccountTransaction[];
  meta: ApiMeta;
}

export interface ContributionsResponse {
  data: Contribution[];
  meta: ApiMeta;
}

export interface LoansResponse {
  data: Loan[];
  meta: ApiMeta;
}

export interface AccountsStatementResponse {
  data: AccountTransaction[];
  meta: ApiMeta;
}

export interface MemberSearchResult {
  id: string;
  full_name: string;
  member_number: string;
}

// ── Query keys ──────────────────────────────────────────────────────────

export const ME_DASHBOARD_KEY  = ["me", "dashboard"]  as const;
export const ME_PROFILE_KEY    = ["me", "profile"]    as const;
export const ME_ACCOUNTS_KEY   = ["me", "accounts"]   as const;
export const ME_LOANS_KEY      = ["me", "loans"]      as const;
export const ME_CONTRIBUTIONS_KEY = ["me", "contributions"] as const;
export const ME_GUARANTEES_KEY = ["me", "guarantees"] as const;
export const ME_ISSUES_KEY     = ["me", "issues"]     as const;
export const ME_TRANSACTIONS_KEY = ["me", "transactions"] as const;
export const ME_MEMBER_SEARCH_KEY = ["me", "members", "search"] as const;

// ── Dashboard ────────────────────────────────────────────────────────────

export function useMemberDashboard() {
  return useQuery<MemberDashboard>({
    queryKey: ME_DASHBOARD_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MemberDashboard>>("/me/dashboard");
      return data.data;
    },
    staleTime: 60_000,
  });
}

// ── Profile ───────────────────────────────────────────────────────────────

export function useMemberProfile() {
  return useQuery<Member>({
    queryKey: ME_PROFILE_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Member>>("/me/profile");
      return data.data;
    },
    staleTime: 60_000,
  });
}

// ── Accounts ──────────────────────────────────────────────────────────────

export function useMemberAccounts() {
  return useQuery<DepositAccount[]>({
    queryKey: ME_ACCOUNTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DepositAccount[]>>("/me/accounts");
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useMemberAccountStatement(
  accountId: string,
  params?: { from_date?: string; to_date?: string; per_page?: number }
) {
  return useQuery<AccountsStatementResponse>({
    queryKey: [...ME_ACCOUNTS_KEY, accountId, "statement", params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AccountTransaction[]>>(
        `/me/accounts/${accountId}/statement`,
        { params }
      );
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
    enabled: !!accountId,
  });
}

// ── Loans ─────────────────────────────────────────────────────────────────

export function useMemberLoans(params?: { per_page?: number }) {
  return useQuery<LoansResponse>({
    queryKey: [...ME_LOANS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Loan[]>>("/me/loans", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useMemberLoan(loanId: string) {
  return useQuery<Loan>({
    queryKey: [...ME_LOANS_KEY, loanId],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Loan>>(`/me/loans/${loanId}`);
      return data.data;
    },
    staleTime: 30_000,
    enabled: !!loanId,
  });
}

// ── Contributions ────────────────────────────────────────────────────────

export function useMemberContributions(params?: { status?: string; per_page?: number }) {
  return useQuery<ContributionsResponse>({
    queryKey: [...ME_CONTRIBUTIONS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Contribution[]>>("/me/contributions", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

// ── Guarantees ────────────────────────────────────────────────────────────

export function useMemberGuarantees(params?: { status?: string; per_page?: number }) {
  return useQuery<GuaranteesResponse>({
    queryKey: [...ME_GUARANTEES_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Guarantee[]>>("/me/guarantees", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

// ── Issues ────────────────────────────────────────────────────────────────

export function useMemberIssues(params?: { status?: string; per_page?: number }) {
  return useQuery<{ data: Issue[]; meta: ApiMeta }>({
    queryKey: [...ME_ISSUES_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Issue[]>>("/me/issues", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useCreateMemberIssue() {
  const queryClient = useQueryClient();
  return useMutation<Issue, Error, { category_id: string; title: string; description?: string; priority?: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Issue>>("/me/issues", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ME_ISSUES_KEY });
    },
  });
}

export function useAddMemberIssueComment() {
  const queryClient = useQueryClient();
  return useMutation<IssueComment, Error, { issueId: string; body: string }>({
    mutationFn: async ({ issueId, body }) => {
      const { data } = await api.post<ApiEnvelope<IssueComment>>(`/me/issues/${issueId}/comments`, { body });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ME_ISSUES_KEY });
    },
  });
}

// ── Petty Cash ────────────────────────────────────────────────────────────

export function useMemberPettyCashAllocations(params?: { per_page?: number }) {
  return useQuery<{ data: PettyCashAllocation[]; meta: ApiMeta }>({
    queryKey: ["me", "petty-cash", "allocations", params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PettyCashAllocation[]>>("/me/petty-cash/allocations", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useMemberPettyCashRequests(params?: { per_page?: number }) {
  return useQuery<{ data: PettyCashRequest[]; meta: ApiMeta }>({
    queryKey: ["me", "petty-cash", "requests", params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PettyCashRequest[]>>("/me/petty-cash/requests", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

// ── All transactions ──────────────────────────────────────────────────────

export function useMemberTransactions(params?: {
  from_date?: string;
  to_date?: string;
  transaction_type?: string;
  per_page?: number;
}) {
  return useQuery<TransactionsResponse>({
    queryKey: [...ME_TRANSACTIONS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AccountTransaction[]>>("/me/transactions", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

// ── Loan application ──────────────────────────────────────────────────────

export interface ApplyLoanPayload {
  loan_product_id: string;
  principal_amount: string;
  repayment_period: number;
  disburse_account_id?: string;
  guarantors?: Array<{ member_id: string; guaranteed_amount: string }>;
}

export function useApplyLoan() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, ApplyLoanPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Loan>>("/me/loans", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_LOANS_KEY });
    },
  });
}

export function useAddMemberLoanGuarantor(loanId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { member_id: string; guaranteed_amount: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/me/loans/${loanId}/guarantors`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_LOANS_KEY });
    },
  });
}

export function useAcceptGuarantee() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (guaranteeId) => {
      const { data } = await api.post(`/me/guarantees/${guaranteeId}/accept`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_GUARANTEES_KEY });
    },
  });
}

export function useDeclineGuarantee() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { guaranteeId: string; reason?: string }>({
    mutationFn: async ({ guaranteeId, reason }) => {
      const { data } = await api.post(`/me/guarantees/${guaranteeId}/decline`, { reason });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_GUARANTEES_KEY });
    },
  });
}

export function useMemberSearch(q: string) {
  return useQuery<MemberSearchResult[]>({
    queryKey: [...ME_MEMBER_SEARCH_KEY, q],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MemberSearchResult[]>>("/me/members/search", { params: { q } });
      return data.data;
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

export const ME_LOAN_PRODUCTS_KEY = ["me", "loan-products"] as const;

export function useMemberLoanProducts() {
  return useQuery<LoanProduct[]>({
    queryKey: ME_LOAN_PRODUCTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<LoanProduct[]>>("/me/loan-products");
      return data.data;
    },
    staleTime: 300_000,
  });
}

export const ME_ISSUE_CATEGORIES_KEY = ["me", "issue-categories"] as const;

export function usePortalIssueCategories() {
  return useQuery<IssueCategory[]>({
    queryKey: ME_ISSUE_CATEGORIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<IssueCategory[]>>("/me/issue-categories");
      return data.data;
    },
    staleTime: 300_000,
  });
}
