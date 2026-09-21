import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getPostTargetOptions } from "@/modules/post/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth("STAFF");

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
