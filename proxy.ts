// Next.js 16: middleware renamed to `proxy` (Node runtime).
// Cheap auth gate — verifies the session cookie signature, redirects if missing/invalid.
// Full role checks happen in server components via requireRole().
import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";

const PROTECTED = ["/admin", "/recruiter"];
const PUBLIC_INSIDE_ADMIN = ["/admin/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (PUBLIC_INSIDE_ADMIN.some((p) => pathname === p)) {
    return NextResponse.next();
  }
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next internals + the public landing + register + api/files
  matcher: ["/((?!_next|api/files|favicon.ico|register|$).*)"],
};
