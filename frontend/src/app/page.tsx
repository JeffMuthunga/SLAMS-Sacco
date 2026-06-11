import { redirect } from "next/navigation";

// Role-aware landing happens after auth: admins → /admin/dashboard,
// members → /member/dashboard. Until roles are wired to the Laravel API,
// default to the admin portal.
export default function RootPage() {
  redirect("/admin/dashboard");
}
