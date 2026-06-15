import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface ShareProduct {
  id: string;
  name: string;
  price_per_share: string;
  min_shares: number;
  max_shares: number | null;
  is_active: boolean;
  share_capital_account_id: string | null;
  created_at: string;
}

export type CreateShareProductPayload = {
  name: string;
  price_per_share: string;
  min_shares: number;
  max_shares?: number | null;
  is_active?: boolean;
  share_capital_account_id?: string | null;
};

export type UpdateShareProductPayload = Partial<CreateShareProductPayload>;

export interface MemberShare {
  id: string;
  quantity: number;
  price_per_share: string;
  total_amount: string;
  purchase_date: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  approved_at: string | null;
  member?: { id: string; full_name: string; member_number: string };
  share_product?: ShareProduct;
  deposit_account?: { id: string; account_number: string };
  created_at: string;
}

export interface MemberSharesParams {
  member_id?: string;
  status?: string;
  per_page?: number;
  page?: number;
}

export interface MemberSharesResponse {
  data: MemberShare[];
  meta: ApiMeta;
}

export type CreateMemberSharePayload = {
  member_id: string;
  share_product_id: string;
  quantity: number;
  purchase_date?: string;
  deposit_account_id?: string;
  notes?: string;
};

export interface ShareBalance {
  summary: Array<{ product_name: string; quantity: number; total_value: string }>;
  total_value: string;
}

export interface MySharesResponse {
  shares: MemberShare[];
  balance: ShareBalance;
}

// ── Query keys ─────────────────────────────────────────────────────────

export const SHARE_PRODUCTS_KEY = ["share-products"] as const;
export const MEMBER_SHARES_KEY = ["member-shares"] as const;
export const MY_SHARES_KEY = ["my-shares"] as const;

// ── Share Product Queries ───────────────────────────────────────────────

export function useShareProducts() {
  return useQuery<ShareProduct[]>({
    queryKey: SHARE_PRODUCTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ShareProduct[]>>(
        "/configurations/share-products"
      );
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useShareProduct(id: string) {
  return useQuery<ShareProduct>({
    queryKey: [...SHARE_PRODUCTS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ShareProduct>>(
        `/configurations/share-products/${id}`
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Share Product Mutations ─────────────────────────────────────────────

export function useCreateShareProduct() {
  const qc = useQueryClient();
  return useMutation<ShareProduct, Error, CreateShareProductPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<ShareProduct>>(
        "/configurations/share-products",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHARE_PRODUCTS_KEY });
    },
  });
}

export function useUpdateShareProduct() {
  const qc = useQueryClient();
  return useMutation<ShareProduct, Error, { id: string } & UpdateShareProductPayload>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<ShareProduct>>(
        `/configurations/share-products/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: SHARE_PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: [...SHARE_PRODUCTS_KEY, id] });
    },
  });
}

export function useDeleteShareProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/share-products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHARE_PRODUCTS_KEY });
    },
  });
}

// ── Member Shares Queries ───────────────────────────────────────────────

export function useMemberShares(params?: MemberSharesParams) {
  return useQuery<MemberSharesResponse>({
    queryKey: [...MEMBER_SHARES_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<{ data: MemberShare[]; meta: ApiMeta }>>("/member-shares", {
        params,
      });
      return { data: data.data.data, meta: data.data.meta };
    },
    staleTime: 30_000,
  });
}

export function useMemberShare(id: string) {
  return useQuery<MemberShare>({
    queryKey: [...MEMBER_SHARES_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MemberShare>>(`/member-shares/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Member Shares Mutations ─────────────────────────────────────────────

export function useCreateMemberShare() {
  const qc = useQueryClient();
  return useMutation<MemberShare, Error, CreateMemberSharePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<MemberShare>>("/member-shares", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBER_SHARES_KEY });
    },
  });
}

export function useApproveShare() {
  const qc = useQueryClient();
  return useMutation<MemberShare, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<MemberShare>>(
        `/member-shares/${id}/approve`
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBER_SHARES_KEY });
    },
  });
}

export function useRejectShare() {
  const qc = useQueryClient();
  return useMutation<MemberShare, Error, { id: string; reason?: string }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.post<ApiEnvelope<MemberShare>>(
        `/member-shares/${id}/reject`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBER_SHARES_KEY });
    },
  });
}

// ── Member Portal Hooks ─────────────────────────────────────────────────

export function useMyShares() {
  return useQuery<MySharesResponse>({
    queryKey: MY_SHARES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MySharesResponse>>("/me/shares");
      return data.data;
    },
    staleTime: 30_000,
  });
}
