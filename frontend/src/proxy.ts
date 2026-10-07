import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "prompters_session";
const PROTECTED = ["/dashboard", "/learn", "/practice", "/reviews", "/projects", "/workspace", "/prompts", "/interviews", "/mock-tests", "/readiness", "/journey", "/applications", "/profile", "/settings", "/onboarding", "/quiz", "/admin", "/build", "/career"];

/**
 * Optimistic gate only: redirects visitors without a session cookie. Real
 * authentication and authorisation happen on the backend for every API call.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
