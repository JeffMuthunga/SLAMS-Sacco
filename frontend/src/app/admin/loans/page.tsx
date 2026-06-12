import Link from "next/link";
import LoansTable from "@/components/Loans/LoansTable";

export default function LoansPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Loans</h1>
        <Link
          href="/admin/loans/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + New Loan Application
        </Link>
      </div>
      <LoansTable />
    </div>
  );
}
