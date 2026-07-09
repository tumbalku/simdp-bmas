import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { logoutUser } from "@/modules/auth/service";
import { clearAuthCookies, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("UNAUTHENTICATED", "User belum terotentikasi", undefined, 401);
    }

    const refreshToken = request.cookies.get("refresh_token")?.value;

    // Fetch user detail for actor name
    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });

    const actorName = user?.employee?.name || user?.email || "User";
    const actorRole = session.role;

    if (refreshToken) {
      await logoutUser(refreshToken, session.userId, actorName, actorRole);
    }

    await clearAuthCookies();

    return successResponse({ success: true });
  } catch (error) {
    console.error("Logout route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
