import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

export interface DividendEntry {
  id: string;
  dividend_run_id: string;
  member_id: string;
  member: { id: string; full_name: string; member_number: string } | null;
  share_balance: string;
  dividend_amount: string;
  credited_account_id: string | null;
  posted_at: string | null;
  created_at: string;
}

export interface DividendRun {
  id: string;
  fiscal_year_id: string;
  fiscal_year: { id: string; name: string } | null;
  rate: string;
  status: "draft" | "approved" | "posted";
  total_dividend: string;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  posted_at: string | null;
  entries_count?: number;
  entries?: DividendEntry[];
  created_at: string;
}

export type CreateDividendRunPayload = {
  fiscal_year_id: string;
  rate: string;
  notes?: string;
};

export const DIVIDEND_RUNS_KEY = ["dividend-runs"] as const;

export function useDividendRuns() {
  return useQuery<{ data: DividendRun[]; meta: ApiMeta }>({
    queryKey: DIVIDEND_RUNS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DividendRun[]>>("/dividend-runs");
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useDividendRun(id: string) {
  return useQuery<DividendRun>({
    queryKey: [...DIVIDEND_RUNS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DividendRun>>(`/dividend-runs/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useMyDividends() {
  return useQuery<DividendEntry[]>({
    queryKey: ["me", "dividends"],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DividendEntry[]>>("/me/dividends");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateDividendRun() {
  const qc = useQueryClient();
  return useMutation<DividendRun, Error, CreateDividendRunPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<DividendRun>>("/dividend-runs", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY }),
  });
}

export function useApproveDividendRun() {
  const qc = useQueryClient();
  return useMutation<DividendRun, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<DividendRun>>(`/dividend-runs/${id}/approve`);
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY });
      qc.invalidateQueries({ queryKey: [...DIVIDEND_RUNS_KEY, id] });
    },
  });
}

export function usePostDividendRun() {
  const qc = useQueryClient();
  return useMutation<DividendRun, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<DividendRun>>(`/dividend-runs/${id}/post`);
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY });
      qc.invalidateQueries({ queryKey: [...DIVIDEND_RUNS_KEY, id] });
    },
  });
}

export function useDeleteDividendRun() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/dividend-runs/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY }),
  });
}
