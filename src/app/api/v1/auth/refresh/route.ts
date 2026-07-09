import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { rotateSession } from "@/modules/auth/service";
import { setAuthCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return errorResponse("UNAUTHENTICATED", "Cookie refresh token tidak ada", undefined, 401);
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const userAgent = request.headers.get("user-agent") || null;

    const result = await rotateSession(refreshToken, ipAddress, userAgent);

    if (!result) {
      return errorResponse("SESSION_EXPIRED", "Sesi telah kadaluwarsa, silakan login kembali", undefined, 401);
    }

    await setAuthCookies(
      result.user.id,
      result.user.role,
      result.user.employeeId,
      result.refreshTokenPlain
    );

    return successResponse({ ok: true });
  } catch (error) {
    console.error("Refresh route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
