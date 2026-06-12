"use client";

import React from "react";
import Link from "next/link";
import { useMemberDashboard } from "@/lib/api/member-portal";
import { useSession } from "@/lib/auth/auth-client";

function StatCard({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const card = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-dark dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function MemberDashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading } = useMemberDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's your SACCO summary.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Savings Balance"
            value={stats ? `KES ${Number(stats.total_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}` : "—"}
            href="/member/service-desk/accounts"
          />
          <StatCard
            label="Active Loans"
            value={stats ? String(stats.active_loans) : "—"}
            href="/member/service-desk/loans"
          />
          <StatCard
            label="Outstanding Loan Balance"
            value={stats ? `KES ${Number(stats.outstanding_loan_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}` : "—"}
            href="/member/service-desk/loans"
          />
          <StatCard
            label="Pending Contributions"
            value={stats ? String(stats.pending_contributions) : "—"}
            href="/member/account-statement/contributions"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "My Accounts",    desc: "View balances and statements",      href: "/member/service-desk/accounts" },
          { title: "My Loans",       desc: "Track loan status and repayments",  href: "/member/service-desk/loans" },
          { title: "Contributions",  desc: "View contribution history",         href: "/member/account-statement/contributions" },
          { title: "Guarantees",     desc: "Loans you have guaranteed",         href: "/member/guarantees/active" },
          { title: "Issue Tracking", desc: "Raise or track support issues",     href: "/member/service-desk/issues" },
          { title: "Transactions",   desc: "All account transactions",          href: "/member/account-statement/transactions" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-gray-200 bg-white p-5 hover:border-primary hover:shadow-sm dark:border-gray-700 dark:bg-gray-dark"
          >
            <p className="font-semibold text-dark dark:text-white">{item.title}</p>
            <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
