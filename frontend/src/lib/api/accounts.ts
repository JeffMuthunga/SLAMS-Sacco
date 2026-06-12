import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface DepositAccount {
  id: string;
  account_number: string;
  balance: string;
  interest_rate: string;
  opening_date: string;
  last_activity_date: string | null;
  is_active: boolean;
  is_locked: boolean;
  locked_until_date: string | null;
  approval_status: "draft" | "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  org_id: string;
  member: { id: string; full_name: string; member_number: string } | null;
  product: { id: string; name: string } | null;
  created_at: string;
}

export interface AccountTransaction {
  id: string;
  deposit_account_id: string;
  transaction_type:
    | "deposit"
    | "withdrawal"
    | "interest_credit"
    | "fee"
    | "transfer_in"
    | "transfer_out"
    | "loan_disbursement"
    | "loan_repayment"
    | "contribution";
  amount: string;
  balance_after: string;
  reference_number: string | null;
  transaction_date: string;
  value_date: string;
  narration: string | null;
  linked_transaction_id: string | null;
  approval_status: string;
  approved_at: string | null;
  created_by: string;
  created_at: string;
}

export interface AccountsParams {
  search?: string;
  status?: string;
  member_id?: string;
  per_page?: number;
  page?: number;
}

export interface TransactionsParams {
  deposit_account_id?: string;
  transaction_type?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export type CreateDepositAccountPayload = {
  member_id: string;
  product_id: string;
  opening_date: string;
  interest_rate?: string;
};

export type UpdateDepositAccountPayload = {
  interest_rate?: string;
  is_locked?: boolean;
  locked_until_date?: string | null;
};

export type CreateTransactionPayload = {
  deposit_account_id: string;
  transaction_type: "deposit" | "withdrawal" | "transfer_out";
  to_account_id?: string;
  amount: string;
  reference_number?: string;
  transaction_date: string;
  value_date?: string;
  narration?: string;
};

// ── Query keys ─────────────────────────────────────────────────────────

export const ACCOUNTS_KEY = ["accounts"] as const;
export const TRANSACTIONS_KEY = ["account-transactions"] as const;

// ── Response wrappers ──────────────────────────────────────────────────

export interface AccountsResponse {
  data: DepositAccount[];
  meta: ApiMeta;
}

export interface TransactionsResponse {
  data: AccountTransaction[];
  meta: ApiMeta;
}

export interface StatementResponse {
  account: DepositAccount;
  transactions: AccountTransaction[];
  meta: ApiMeta;
}

// ── Queries ────────────────────────────────────────────────────────────

export function useAccounts(params?: AccountsParams) {
  return useQuery<AccountsResponse>({
    queryKey: [...ACCOUNTS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DepositAccount[]>>("/accounts", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useAccount(id: string) {
  return useQuery<DepositAccount>({
    queryKey: [...ACCOUNTS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DepositAccount>>(`/accounts/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useAccountStatement(id: string, params?: { per_page?: number; page?: number }) {
  return useQuery<StatementResponse>({
    queryKey: [...ACCOUNTS_KEY, id, "statement", params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<{ account: DepositAccount; transactions: AccountTransaction[] }>>(
        `/accounts/${id}/statement`,
        { params }
      );
      return {
        account: data.data.account,
        transactions: data.data.transactions,
        meta: data.meta!,
      };
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useAccountTransactions(params?: TransactionsParams) {
  return useQuery<TransactionsResponse>({
    queryKey: [...TRANSACTIONS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AccountTransaction[]>>("/account-transactions", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 15_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation<DepositAccount, Error, CreateDepositAccountPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<DepositAccount>>("/accounts", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUpdateAccount(id: string) {
  const qc = useQueryClient();
  return useMutation<DepositAccount, Error, UpdateDepositAccountPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<DepositAccount>>(`/accounts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useApproveAccount() {
  const qc = useQueryClient();
  return useMutation<DepositAccount, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<DepositAccount>>(`/accounts/${id}/approve`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useRejectAccount() {
  const qc = useQueryClient();
  return useMutation<DepositAccount, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<DepositAccount>>(`/accounts/${id}/reject`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useCloseAccount() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation<AccountTransaction, Error, CreateTransactionPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<AccountTransaction>>("/account-transactions", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}
