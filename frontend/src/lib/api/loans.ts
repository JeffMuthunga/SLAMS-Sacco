import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface LoanGuarantee {
  id: string;
  loan_id: string;
  member: { id: string; full_name: string; member_number: string } | null;
  guaranteed_amount: string;
  is_accepted: boolean;
  accepted_at: string | null;
  is_active: boolean;
  approval_status: string;
  created_at: string;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  due_date: string;
  paid_date: string | null;
  principal_due: string;
  principal_paid: string;
  interest_due: string;
  interest_paid: string;
  penalty_due: string;
  penalty_paid: string;
  total_due: string;
  total_paid: string;
  balance: string;
  repayment_status: "pending" | "partial" | "paid" | "overdue";
  created_at: string;
}

export interface LoanCollateral {
  id: string;
  collateral_type: string;
  description: string | null;
  estimated_value: string;
  is_received: boolean;
  is_released: boolean;
}

export interface LoanNote {
  id: string;
  note: string;
  created_by: string;
  created_at: string;
}

export type LoanStatus =
  | "draft" | "applied" | "guarantors_confirmed" | "approved" | "rejected"
  | "disbursed" | "active" | "repaid" | "defaulted";

export interface Loan {
  id: string;
  account_number: string;
  principal_amount: string;
  interest_rate: string;
  repayment_period: number;
  repayment_frequency: string;
  repayment_amount: string;
  total_payable: string;
  outstanding_balance: string;
  disbursed_date: string | null;
  maturity_date: string | null;
  expected_maturity_date: string | null;
  loan_status: LoanStatus;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  applied_at: string | null;
  org_id: string;
  member: { id: string; full_name: string; member_number: string; phone: string } | null;
  loan_product: {
    id: string;
    name: string;
    interest_method: string;
    requires_guarantor: boolean;
    requires_collateral: boolean;
  } | null;
  disburse_account: { id: string; account_number: string } | null;
  guarantees: LoanGuarantee[];
  collaterals: LoanCollateral[];
  repayments: LoanRepayment[];
  notes: LoanNote[];
  created_at: string;
}

export interface LoansParams {
  loan_status?: string;
  member_id?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface LoansResponse {
  data: Loan[];
  meta: ApiMeta;
}

export type CreateLoanPayload = {
  member_id: string;
  loan_product_id: string;
  principal_amount: string;
  interest_rate?: string;
  repayment_period: number;
  repayment_frequency?: string;
  note?: string;
  guarantors?: Array<{ member_id: string; guaranteed_amount: string }>;
  collaterals?: Array<{ collateral_type: string; description?: string; estimated_value: string }>;
};

export type DisbursePayload = {
  disburse_account_id: string;
  disbursed_date?: string;
};

export type RecordRepaymentPayload = {
  amount: string;
  paid_date?: string;
};

// ── Query key ──────────────────────────────────────────────────────────

export const LOANS_KEY = ["loans"] as const;

// ── Queries ────────────────────────────────────────────────────────────

export function useLoans(params?: LoansParams) {
  return useQuery<LoansResponse>({
    queryKey: [...LOANS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Loan[]>>("/loans", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useLoan(id: string) {
  return useQuery<Loan>({
    queryKey: [...LOANS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Loan>>(`/loans/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, CreateLoanPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Loan>>("/loans", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Loan>>(`/loans/${id}/approve`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useRejectLoan() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post<ApiEnvelope<Loan>>(`/loans/${id}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useDisburseLoan() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, { id: string } & DisbursePayload>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.post<ApiEnvelope<Loan>>(`/loans/${id}/disburse`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useMarkDefaulted() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Loan>>(`/loans/${id}/default`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useAddLoanNote() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, { id: string; note: string }>({
    mutationFn: async ({ id, note }) => {
      const { data } = await api.post<ApiEnvelope<Loan>>(`/loans/${id}/notes`, { note });
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [...LOANS_KEY, id] });
    },
  });
}

export function useArchiveLoan() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/loans/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useRecordRepayment() {
  const qc = useQueryClient();
  return useMutation<LoanRepayment, Error, { loanId: string; repaymentId: string } & RecordRepaymentPayload>({
    mutationFn: async ({ loanId, repaymentId, ...payload }) => {
      const { data } = await api.post<ApiEnvelope<LoanRepayment>>(
        `/loans/${loanId}/repayments/${repaymentId}/pay`,
        payload
      );
      return data.data;
    },
    onSuccess: (_data, { loanId }) => {
      qc.invalidateQueries({ queryKey: [...LOANS_KEY, loanId] });
      qc.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}
