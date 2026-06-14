import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface MemberKin {
  id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  id_number: string | null;
  id_type: string | null;
  phone: string | null;
  is_emergency_contact: boolean;
  is_beneficiary: boolean;
  beneficiary_percent: string | null;
}

export interface Member {
  id: string;
  user_id: string | null;
  member_number: string;
  full_name: string;
  title: string | null;
  id_number: string;
  id_type: string;
  email: string | null;
  phone: string;
  phone2: string | null;
  date_of_birth: string;
  gender: string | null;
  nationality: string | null;
  marital_status: string | null;
  address: string | null;
  town: string | null;
  postal_code: string | null;
  photo_url: string | null;
  employed: boolean;
  self_employed: boolean;
  employer_name: string | null;
  monthly_salary: string | null;
  monthly_net_income: string | null;
  entry_date: string;
  is_active: boolean;
  approval_status: "draft" | "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  terminated_at: string | null;
  termination_reason: string | null;
  org_id: string;
  kins: MemberKin[];
  created_at: string;
}

export interface MembersParams {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
}

export type CreateMemberPayload = Omit<
  Partial<Member>,
  "id" | "member_number" | "approval_status" | "org_id" | "kins" | "photo_url" | "created_at"
> & {
  full_name: string;
  id_number: string;
  id_type: string;
  phone: string;
  date_of_birth: string;
  entry_date: string;
  kins?: Array<Omit<MemberKin, "id"> & { id?: string }>;
};

export type UpdateMemberPayload = CreateMemberPayload;

// ── Query key ──────────────────────────────────────────────────────────

export const MEMBERS_KEY = ["members"] as const;

// ── Queries ────────────────────────────────────────────────────────────

export interface MembersResponse {
  data: Member[];
  meta: ApiMeta;
}

export function useMembers(params?: MembersParams) {
  return useQuery<MembersResponse>({
    queryKey: [...MEMBERS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Member[]>>("/members", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useMember(id: string) {
  return useQuery<Member>({
    queryKey: [...MEMBERS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Member>>(`/members/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useArchivedMembers(params?: MembersParams) {
  return useQuery<MembersResponse>({
    queryKey: [...MEMBERS_KEY, "archived", params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Member[]>>("/members/archived", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, CreateMemberPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Member>>("/members", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useUpdateMember(id: string) {
  const qc = useQueryClient();
  return useMutation<Member, Error, UpdateMemberPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<Member>>(`/members/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useRestoreMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Member>>(`/members/${id}/restore`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useApproveMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Member>>(`/members/${id}/approve`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useRejectMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post<ApiEnvelope<Member>>(`/members/${id}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useCreatePortalAccount() {
  const qc = useQueryClient();
  return useMutation<Member, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Member>>(`/members/${id}/create-portal-account`);
      return data.data;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [...MEMBERS_KEY, id] });
    },
  });
}

export function useUploadMemberPhoto(memberId: string) {
  const qc = useQueryClient();
  return useMutation<Member, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await api.post<ApiEnvelope<Member>>(
        `/members/${memberId}/photo`,
        formData
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...MEMBERS_KEY, memberId] });
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}
