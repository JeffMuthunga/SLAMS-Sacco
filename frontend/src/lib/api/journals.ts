import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface AccountType {
  id: string;
  org_id: string;
  code: number;
  name: string;
  created_at: string;
}

export interface ChartOfAccount {
  id: string;
  org_id: string;
  account_type_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  is_header: boolean;
  is_active: boolean;
  account_type: { id: string; code: number; name: string } | null;
  parent: { id: string; code: string; name: string } | null;
  created_at: string;
}

export interface JournalLine {
  id: string;
  account_id: string;
  debit: string;
  credit: string;
  narration: string | null;
  account: { id: string; code: string; name: string } | null;
}

export interface Journal {
  id: string;
  org_id: string;
  fiscal_year_id: string;
  period_id: string;
  reference_number: string;
  journal_date: string;
  narration: string | null;
  is_posted: boolean;
  posted_at: string | null;
  is_reversed: boolean;
  reversed_at: string | null;
  period: { id: string; name: string } | null;
  fiscal_year: { id: string; name: string } | null;
  lines: JournalLine[];
  created_at: string;
}

export interface JournalsParams {
  fiscal_year_id?: string;
  period_id?: string;
  is_posted?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface JournalsResponse {
  data: Journal[];
  meta: ApiMeta;
}

export interface LedgerLine {
  journal_line_id: string;
  journal_id: string;
  reference_number: string;
  journal_date: string;
  narration: string | null;
  debit: string;
  credit: string;
  running_balance: string;
}

export interface LedgerResponse {
  account: { id: string; code: string; name: string };
  lines: LedgerLine[];
}

export interface StoreLedgerLinePayload {
  account_id: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface StoreJournalPayload {
  fiscal_year_id: string;
  period_id: string;
  journal_date: string;
  narration?: string;
  lines: StoreLedgerLinePayload[];
}

// ── Query keys ─────────────────────────────────────────────────────────

export const ACCOUNT_TYPES_KEY    = ["account-types"] as const;
export const CHART_OF_ACCOUNTS_KEY = ["chart-of-accounts"] as const;
export const JOURNALS_KEY         = ["journals"] as const;
export const LEDGER_KEY           = ["ledger"] as const;

// ── Account Types ──────────────────────────────────────────────────────

export function useAccountTypes() {
  return useQuery<AccountType[]>({
    queryKey: ACCOUNT_TYPES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AccountType[]>>("/configurations/account-types");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateAccountType() {
  const qc = useQueryClient();
  return useMutation<AccountType, Error, { code: number; name: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<AccountType>>("/configurations/account-types", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNT_TYPES_KEY }),
  });
}

export function useUpdateAccountType() {
  const qc = useQueryClient();
  return useMutation<AccountType, Error, { id: string; code: number; name: string }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<AccountType>>(`/configurations/account-types/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNT_TYPES_KEY }),
  });
}

export function useDeleteAccountType() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/configurations/account-types/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNT_TYPES_KEY }),
  });
}

// ── Chart of Accounts ──────────────────────────────────────────────────

export interface ChartOfAccountsParams {
  account_type_id?: string;
  active_only?: boolean;
}

export function useChartOfAccounts(params?: ChartOfAccountsParams) {
  return useQuery<ChartOfAccount[]>({
    queryKey: [...CHART_OF_ACCOUNTS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ChartOfAccount[]>>("/configurations/chart-of-accounts", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateChartOfAccount() {
  const qc = useQueryClient();
  return useMutation<ChartOfAccount, Error, Omit<ChartOfAccount, "id" | "org_id" | "account_type" | "parent" | "created_at">>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<ChartOfAccount>>("/configurations/chart-of-accounts", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHART_OF_ACCOUNTS_KEY }),
  });
}

export function useUpdateChartOfAccount() {
  const qc = useQueryClient();
  return useMutation<ChartOfAccount, Error, { id: string } & Partial<ChartOfAccount>>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<ChartOfAccount>>(`/configurations/chart-of-accounts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHART_OF_ACCOUNTS_KEY }),
  });
}

export function useDeleteChartOfAccount() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/configurations/chart-of-accounts/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHART_OF_ACCOUNTS_KEY }),
  });
}

// ── Journals ───────────────────────────────────────────────────────────

export function useJournals(params?: JournalsParams) {
  return useQuery<JournalsResponse>({
    queryKey: [...JOURNALS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Journal[]>>("/journals", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useJournal(id: string) {
  return useQuery<Journal>({
    queryKey: [...JOURNALS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Journal>>(`/journals/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateJournal() {
  const qc = useQueryClient();
  return useMutation<Journal, Error, StoreJournalPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Journal>>("/journals", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNALS_KEY }),
  });
}

export function usePostJournal() {
  const qc = useQueryClient();
  return useMutation<Journal, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Journal>>(`/journals/${id}/post`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNALS_KEY }),
  });
}

export function useReverseJournal() {
  const qc = useQueryClient();
  return useMutation<Journal, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Journal>>(`/journals/${id}/reverse`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNALS_KEY }),
  });
}

export function useDeleteJournal() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/journals/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNALS_KEY }),
  });
}

// ── Ledger ─────────────────────────────────────────────────────────────

export interface LedgerParams {
  account_id: string;
  from_date?: string;
  to_date?: string;
}

export function useLedger(params: LedgerParams) {
  return useQuery<LedgerResponse>({
    queryKey: [...LEDGER_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<LedgerResponse>>("/ledger", { params });
      return data.data;
    },
    enabled: !!params.account_id,
    staleTime: 30_000,
  });
}
