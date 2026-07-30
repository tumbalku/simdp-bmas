import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { generateDownloadUrl } from "@/modules/document/server";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requireAuth("STAFF");
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.FILE_DOWNLOAD, {
      actorId: session.userId,
      actorRole: session.role,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    if (!id) {
      return errorResponse("VALIDATION_ERROR", "ID dokumen wajib diisi.", undefined, 400);
    }

    const url = await generateDownloadUrl(id, session);

    return successResponse({ url });
  } catch (error: unknown) {
    console.error("GET /api/v1/verification/documents/[id]/preview-url error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN" || error.code === "OWNERSHIP_REQUIRED"
            ? "Anda tidak memiliki akses ke dokumen ini."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal saat menyiapkan pratinjau.";
    const code =
      message === "UNAUTHENTICATED"
        ? "UNAUTHENTICATED"
        : message === "FORBIDDEN"
          ? "FORBIDDEN"
          : message === "Dokumen tidak ditemukan"
            ? "NOT_FOUND"
            : "INTERNAL_ERROR";

    return errorResponse(code, message, undefined, code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 500);
  }
}
