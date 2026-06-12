import Link from "next/link";
import MembersTable from "@/components/Members/MembersTable";

export default function MembersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Members</h1>
        <Link
          href="/admin/members/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + Add Member
        </Link>
      </div>
      <MembersTable />
    </div>
  );
}
