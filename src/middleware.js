import { NextResponse } from "next/server"

// Cheap guard: pages that need a login redirect to /login when there is no
// session cookie, and come back afterwards. Real authorisation always happens
// inside the API routes (and the pages double-check once the user loads).
export function middleware(req) {
  if (!req.cookies.get("token")) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/home/:path*", "/notifications/:path*"],
}
