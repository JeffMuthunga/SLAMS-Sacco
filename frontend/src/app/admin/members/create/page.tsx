import MemberForm from "@/components/Members/MemberForm";

export default function CreateMemberPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Add Member</h1>
      <MemberForm />
    </div>
  );
}
