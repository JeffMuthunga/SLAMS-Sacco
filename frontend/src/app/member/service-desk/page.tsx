import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Desk",
};

export default function ServiceDeskPage() {
  return (
    <div>
      <h1 className="text-heading-5 font-bold text-dark dark:text-white">
        Service Desk
      </h1>
      <p className="mt-2 text-dark-4 dark:text-dark-6">
        My Accounts, Loans, My Commodities, Transfers, and Issue Tracking will
        appear here.
      </p>
    </div>
  );
}
