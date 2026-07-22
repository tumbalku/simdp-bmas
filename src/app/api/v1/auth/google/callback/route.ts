import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { setAuthCookies, setTwoFactorChallengeCookie } from "@/lib/auth";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import {
  createSessionForAuthenticatedUser,
  isTwoFactorEnabled,
  logGoogleLoginFailure,
  logGoogleLoginSuccess,
  resolveGoogleCallback,
} from "@/modules/auth/server";

const GOOGLE_COOKIE_NAMES = ["google_oauth_state", "google_oauth_nonce", "google_oauth_verifier"] as const;

function clearGoogleCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  for (const name of GOOGLE_COOKIE_NAMES) cookieStore.delete(name);
}

function redirectToLogin(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?oauth_error=${code}`, request.url));
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.AUTH_PUBLIC);
  if (rateLimitResponse) return rateLimitResponse;

  const cookieStore = await cookies();
  const state = cookieStore.get("google_oauth_state")?.value;
  const nonce = cookieStore.get("google_oauth_nonce")?.value;
  const codeVerifier = cookieStore.get("google_oauth_verifier")?.value;

  if (!state || !nonce || !codeVerifier) {
    await logGoogleLoginFailure("GOOGLE_OAUTH_STATE_MISSING", request.headers.get("x-forwarded-for"));
    clearGoogleCookies(cookieStore);
    return redirectToLogin(request, "invalid_request");
  }

  try {
    const result = await resolveGoogleCallback({ request, expectedState: state, expectedNonce: nonce, codeVerifier });
    clearGoogleCookies(cookieStore);
    await logGoogleLoginSuccess(result.user.id, result.user.email, result.user.role, request.headers.get("x-forwarded-for"));

    if (await isTwoFactorEnabled(result.user.id)) {
      await setTwoFactorChallengeCookie(result.user.id);
      return NextResponse.redirect(new URL("/login?google_2fa=1", request.url));
    }

    const session = await createSessionForAuthenticatedUser(
      result.user,
      request.headers.get("x-forwarded-for"),
      request.headers.get("user-agent"),
    );
    await setAuthCookies(session.user.id, session.user.role, session.user.employeeId, session.refreshTokenPlain);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error instanceof Error ? { name: error.name, message: error.message } : error);
    clearGoogleCookies(cookieStore);
    const reason = error instanceof Error && error.message === "GOOGLE_ACCOUNT_NOT_FOUND"
      ? "account_not_found"
      : error instanceof Error && error.message === "GOOGLE_IDENTITY_INVALID"
        ? "identity_invalid"
        : "callback_failed";
    await logGoogleLoginFailure(reason, request.headers.get("x-forwarded-for"));
    return redirectToLogin(request, reason);
  }
}
