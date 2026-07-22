import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { createGoogleAuthorizationRequest, isGoogleOAuthConfigured, logGoogleLoginFailure } from "@/modules/auth/server";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth/google",
  maxAge: 10 * 60,
};

export async function GET(request: NextRequest) {
  const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.AUTH_PUBLIC);
  if (rateLimitResponse) {
    return NextResponse.redirect(new URL("/login?oauth_error=rate_limited", request.url));
  }

  if (!isGoogleOAuthConfigured()) {
    await logGoogleLoginFailure("GOOGLE_OAUTH_NOT_CONFIGURED", request.headers.get("x-forwarded-for"));
    return NextResponse.redirect(new URL("/login?oauth_error=not_configured", request.url));
  }

  try {
    const requestData = await createGoogleAuthorizationRequest();
    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", requestData.state, COOKIE_OPTIONS);
    cookieStore.set("google_oauth_nonce", requestData.nonce, COOKIE_OPTIONS);
    cookieStore.set("google_oauth_verifier", requestData.codeVerifier, COOKIE_OPTIONS);
    return NextResponse.redirect(requestData.authorizationUrl);
  } catch {
    await logGoogleLoginFailure("GOOGLE_AUTHORIZATION_REQUEST_FAILED", request.headers.get("x-forwarded-for"));
    return NextResponse.redirect(new URL("/login?oauth_error=unavailable", request.url));
  }
}
