import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Dashboard",
};

export default function MemberDashboardPage() {
  return (
    <div>
      <h1 className="text-heading-5 font-bold text-dark dark:text-white">
        Member Dashboard
      </h1>
      <p className="mt-2 text-dark-4 dark:text-dark-6">
        Contributions balance, active loans, account overview, and recent
        transactions will appear here.
      </p>
    </div>
  );
}
