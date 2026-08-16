import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { logoutUser } from "@/modules/auth/server";
import { clearAuthCookies, getSession } from "@/lib/auth";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("UNAUTHENTICATED", "User belum terotentikasi", undefined, 401);
    }

    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.AUTH_REFRESH, {
      actorId: session.userId,
      actorRole: session.role,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      await logoutUser(refreshToken, session.userId);
    }

    await clearAuthCookies();

    return successResponse({ success: true });
  } catch (error) {
    console.error("Logout route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
