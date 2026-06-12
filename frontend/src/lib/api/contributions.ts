import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export type ContributionStatus = "pending" | "partial" | "paid" | "waived";

export interface Contribution {
  id: string;
  expected_amount: string;
  paid_amount: string;
  due_date: string;
  paid_date: string | null;
  status: ContributionStatus;
  org_id: string;
  period_id: string;
  member: { id: string; full_name: string; member_number: string } | null;
  deposit_account: { id: string; account_number: string } | null;
  period: { id: string; name: string } | null;
  created_at: string;
}

export interface ContributionsParams {
  period_id?: string;
  member_id?: string;
  status?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface ContributionsResponse {
  data: Contribution[];
  meta: ApiMeta;
}

// ── Query key ──────────────────────────────────────────────────────────

export const CONTRIBUTIONS_KEY = ["contributions"] as const;

// ── Queries ────────────────────────────────────────────────────────────

export function useContributions(params?: ContributionsParams) {
  return useQuery<ContributionsResponse>({
    queryKey: [...CONTRIBUTIONS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Contribution[]>>("/contributions", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useContribution(id: string) {
  return useQuery<Contribution>({
    queryKey: [...CONTRIBUTIONS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Contribution>>(`/contributions/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useGenerateContributions() {
  const qc = useQueryClient();
  return useMutation<{ generated: number }, Error, { period_id: string; expected_amount?: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<{ generated: number }>>(
        "/contributions/generate",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRIBUTIONS_KEY });
    },
  });
}

export function usePayContribution() {
  const qc = useQueryClient();
  return useMutation<Contribution, Error, { id: string; amount: string; paid_date?: string }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.post<ApiEnvelope<Contribution>>(
        `/contributions/${id}/pay`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRIBUTIONS_KEY });
    },
  });
}

export function useWaiveContribution() {
  const qc = useQueryClient();
  return useMutation<Contribution, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Contribution>>(`/contributions/${id}/waive`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRIBUTIONS_KEY });
    },
  });
}
