import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Role-aware landing: the proxy guarantees a session cookie exists, but the
// API is the authority — fall back to /login if the session is invalid.
export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  redirect(session.user.role === "member" ? "/member/dashboard" : "/admin/dashboard");
}
