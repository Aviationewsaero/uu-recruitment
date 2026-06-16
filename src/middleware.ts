import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Forward the request pathname as a header so server-side layouts can read it.
// (headers() only gives you incoming request headers; there's no built-in way
// to get the current pathname in an RSC layout without middleware doing this.)
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/:path*"],
};
