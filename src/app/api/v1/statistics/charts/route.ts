import { requireAuth } from "@/lib/auth";
import { getStatisticsChartsData } from "@/modules/statistics/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Authenticate user with minimum role of STAFF (ADMIN and STAFF)
    await requireAuth("STAFF");

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
