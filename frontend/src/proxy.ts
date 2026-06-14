import { NextRequest, NextResponse } from "next/server";

/**
 * Route protection (Next 16 proxy, formerly middleware). Presence-only check
 * on the Laravel session cookie — the API remains the authority; every data
 * request is re-authenticated server-side. Role-based routing (admin vs
 * member) is enforced client-side and by the API until a role claim is
 * exposed in a readable cookie.
 */
const AUTH_ONLY_PATHS = ["/login", "/register"];
const SESSION_COOKIE_NAME =
  process.env.NEXT_PUBLIC_SESSION_COOKIE ?? "slams_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthOnly = AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path));
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  // Redirect unauthenticated users away from protected routes.
  // Auth pages (/login, /forgot-password, etc.) are always accessible — the
  // API is the authority; a stale session cookie must not trap the user in a
  // redirect loop after logout.
  if (!hasSession && !isAuthOnly) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
