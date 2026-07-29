import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";
import { isAuthPagePath, isProtectedPath } from "@/lib/route-protection";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isInfrastructureAsset = pathname.startsWith("/_next") || pathname.includes("favicon.ico");
  const isAuthManagedEndpoint =
    // Public auth endpoints validate/rate-limit their own request contract in the route handler.
    pathname.startsWith("/api/v1/auth/login") ||
    pathname.startsWith("/api/v1/auth/forgot-password") ||
    pathname.startsWith("/api/v1/auth/reset-password") ||
    // Session endpoints must stay reachable when the access token is expired or being cleared.
    pathname.startsWith("/api/v1/auth/refresh") ||
    pathname.startsWith("/api/v1/auth/logout");

  if (isInfrastructureAsset || isAuthManagedEndpoint) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  let payload = null;

  if (token) {
    try {
      const { payload: verified } = await jwtVerify(token, JWT_SECRET);
      payload = verified;
    } catch {
      // Token is invalid/expired
    }
  }

  if (isProtectedPath(pathname) && !payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPagePath(pathname) && payload) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  const requestHeaders = new Headers(request.headers);
  if (payload) {
    requestHeaders.set("x-user-id", (payload.userId as string) || "");
    requestHeaders.set("x-user-role", (payload.role as string) || "");
    requestHeaders.set("x-employee-id", (payload.employeeId as string) || "");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|assets|favicon.ico|api/v1/cron).*)",
  ],
};
