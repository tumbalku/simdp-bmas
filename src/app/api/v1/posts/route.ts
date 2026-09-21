import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { getPostFeed } from "@/modules/post/server";
import { postFeedQuerySchema } from "@/modules/post/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const rateLimitResponse = await enforceApiRateLimit(
      request,
      API_RATE_LIMIT_CATEGORY.NOTIFICATION_READ,
      { actorId: session.userId, actorRole: session.role },
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const parsed = postFeedQuerySchema.safeParse({
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      search: searchParams.get("search") || undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Query feed pengumuman tidak valid.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        400,
      );
    }

    const result = await getPostFeed({
      context: {
        userId: session.userId,
        role: session.role,
        employeeId: session.employeeId ?? null,
        workplaceId: null,
        employeeGroupId: null,
      },
      page: parsed.data?.page,
      pageSize: parsed.data?.pageSize,
      search: parsed.data?.search,
    });

    return successResponse(result.data, result.meta);
  } catch (error: unknown) {
    console.error("GET /api/v1/posts error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses ke pengumuman."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Terjadi kesalahan internal saat memuat pengumuman.",
      undefined,
      500,
    );
  }
}
