import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PORTAL_PREFIXES = ["/patient", "/doctor", "/staff", "/admin"];
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Optimistic routing only. A cookie's presence is never proof of a valid
 * session or a role. The API and AuthGuard remain authoritative.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get("accessToken") ?? request.cookies.get("refreshToken"),
  );

  const isPortal = PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  if (isPortal && !hasSessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSessionCookie) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/staff/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
