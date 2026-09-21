import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { getPostTargetOptions } from "@/modules/post/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireAuth("STAFF");
    const rateLimitResponse = await enforceApiRateLimit(
      request,
      API_RATE_LIMIT_CATEGORY.NOTIFICATION_READ,
      { actorId: session.userId, actorRole: session.role },
    );
    if (rateLimitResponse) return rateLimitResponse;

    const data = await getPostTargetOptions();

    return successResponse(data);
  } catch (error: unknown) {
    console.error("GET /api/v1/posts/target-options error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses mengelola pengumuman."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Terjadi kesalahan internal saat memuat target pengumuman.",
      undefined,
      500,
    );
  }
}
