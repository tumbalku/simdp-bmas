import { requireAuth } from "@/lib/auth";
import { getStatisticsChartsData } from "@/modules/statistics/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Authenticate user with minimum role of STAFF (ADMIN and STAFF)
    const session = await requireAuth("STAFF");
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.STATISTICS_READ, {
      actorId: session.userId,
      actorRole: session.role,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const data = await getStatisticsChartsData();

    return successResponse(data);
  } catch (error: unknown) {
    console.error("GET /api/v1/statistics/charts error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses ke data ini."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal saat memuat data statistik.",
      undefined,
      500,
    );
  }
}
