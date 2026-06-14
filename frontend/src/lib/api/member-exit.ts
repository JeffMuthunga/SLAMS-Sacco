import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiEnvelope, ApiMeta } from "@/lib/api";

export type ExitType = "voluntary" | "death" | "expulsion" | "transfer" | "medical";
export type ExitStatus = "pending" | "approved" | "rejected";

export interface MemberExitMember {
  id: string;
  full_name: string;
  member_number: string;
  phone: string | null;
  email: string | null;
}

export interface MemberExitUser {
  id: string;
  name: string;
}

export interface MemberExit {
  id: string;
  org_id: string;
  reference_number: string;
  exit_type: ExitType;
  reason: string | null;
  exit_date: string;
  status: ExitStatus;
  rejection_reason: string | null;
  notes: string | null;
  requested_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  member: MemberExitMember | null;
  requested_by: MemberExitUser | null;
  approved_by: MemberExitUser | null;
  rejected_by: MemberExitUser | null;
  created_at: string | null;
}

export interface MemberExitListParams {
  status?: ExitStatus;
  member_id?: string;
  per_page?: number;
}

export interface CreateMemberExitPayload {
  member_id: string;
  exit_type: ExitType;
  reason?: string;
  exit_date: string;
  notes?: string;
}

const KEY = ["member-exits"] as const;

export function useMemberExits(params: MemberExitListParams = {}) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: async () => {
      const { data } = await api.get<{ data: MemberExit[]; meta: ApiMeta }>(
        "/member-exits",
        { params }
      );
      return data;
    },
  });
}

export function useCreateMemberExit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMemberExitPayload) => {
      const { data } = await api.post<ApiEnvelope<MemberExit>>("/member-exits", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApproveMemberExit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiEnvelope<MemberExit>>(`/member-exits/${id}/approve`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRejectMemberExit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rejection_reason }: { id: string; rejection_reason: string }) => {
      const { data } = await api.post<ApiEnvelope<MemberExit>>(`/member-exits/${id}/reject`, {
        rejection_reason,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
