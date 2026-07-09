import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { logoutUser } from "@/modules/auth/service";
import { clearAuthCookies, getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("UNAUTHENTICATED", "User belum terotentikasi", undefined, 401);
    }

    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      await logoutUser(refreshToken, session.userId, session.role);
    }

    await clearAuthCookies();

    return successResponse({ success: true });
  } catch (error) {
    console.error("Logout route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
