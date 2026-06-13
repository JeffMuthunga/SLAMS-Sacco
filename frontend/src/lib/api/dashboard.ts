import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardStats {
  total_members: number;
  pending_members: number;
  active_loans: number;
  total_loan_portfolio: string;
  pending_loan_approvals: number;
  total_savings: string;
  contributions_this_month: string;
  open_issues: number;
}

export interface RecentLoan {
  id: string;
  member_name: string;
  member_number: string | null;
  product: string | null;
  principal: string;
  loan_status: string;
  approval_status: string;
  applied_at: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_loans: RecentLoan[];
}

export function useAdminDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardData }>("/admin/dashboard");
      return data.data;
    },
    staleTime: 60_000,
  });
}
