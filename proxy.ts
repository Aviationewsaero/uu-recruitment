// Next.js 16: middleware renamed to `proxy` (Node runtime).
// Cheap auth gate — verifies the session cookie signature, redirects if missing/invalid.
// Full role checks happen in server components via requireRole().
import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";

// All admin-only segments. /api/admin/* was previously unprotected — that
// meant CSV export, bulk email, etc. were reachable without a session.
const PROTECTED = ["/admin", "/recruiter", "/api/admin"];
const PUBLIC_INSIDE_ADMIN = ["/admin/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always forward pathname so server components/layouts can branch on it
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  const passthrough = NextResponse.next({ request: { headers } });

  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return passthrough;
  }
  if (PUBLIC_INSIDE_ADMIN.some((p) => pathname === p)) {
    return passthrough;
  }
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return passthrough;
}

export const config = {
  // Match everything except Next internals + static. Pathname is forwarded
  // via x-pathname for the layout to branch on. Protection check is inside.
  matcher: ["/((?!_next|favicon.ico).*)"],
};
