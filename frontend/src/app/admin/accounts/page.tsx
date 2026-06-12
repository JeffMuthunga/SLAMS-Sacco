import Link from "next/link";
import AccountsTable from "@/components/Accounts/AccountsTable";

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Deposit Accounts</h1>
        <Link
          href="/admin/accounts/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + Open Account
        </Link>
      </div>
      <AccountsTable />
    </div>
  );
}
