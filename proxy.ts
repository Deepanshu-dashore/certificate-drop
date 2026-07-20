import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "certdrop_session";

export default async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isDashboardPath = pathname.startsWith("/dashboard");
  const isProtectedApiPath = (pathname.startsWith("/api/events") && !pathname.includes("/search")) || pathname.startsWith("/api/upload");

  // Authentication check
  const isAuthenticated = !!sessionCookie?.value;

  if (isDashboardPath || isProtectedApiPath) {
    if (!isAuthenticated) {
      if (isProtectedApiPath) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If authenticated and trying to access login/signup/register page, redirect to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/register" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/api/events/:path*",
    "/api/upload/:path*",
  ],
};
