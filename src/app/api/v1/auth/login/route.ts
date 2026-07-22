import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { isLoginRateLimited, loginUser, logRateLimitedLoginAttempt, createSessionForAuthenticatedUser, isTwoFactorEnabled } from "@/modules/auth/server";
import { setAuthCookies, setTwoFactorChallengeCookie } from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { identifier, password } = parsed.data;
    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const userAgent = request.headers.get("user-agent") || null;

    if (await isLoginRateLimited(ipAddress)) {
      await logRateLimitedLoginAttempt(ipAddress);
      return errorResponse("RATE_LIMITED", "Terlalu banyak percobaan login gagal. Coba lagi 15 menit kemudian.", undefined, 429);
    }

    const result = await loginUser(identifier, password, ipAddress, userAgent, { createSession: false });

    if (!result) {
      return errorResponse("UNAUTHENTICATED", "Identifier atau password salah", undefined, 401);
    }

    if (await isTwoFactorEnabled(result.user.id)) {
      await setTwoFactorChallengeCookie(result.user.id);
      return successResponse({ requiresTwoFactor: true });
    }

    const session = await createSessionForAuthenticatedUser(result.user, ipAddress, userAgent);
    await setAuthCookies(session.user.id, session.user.role, session.user.employeeId, session.refreshTokenPlain);

    return successResponse({ user: result.user });
  } catch (error) {
    console.error("Login route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
