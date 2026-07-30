import { z } from "zod";

import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { getNotifications } from "@/modules/notification/server";

export const dynamic = "force-dynamic";

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional(),
  isRead: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.NOTIFICATION_READ, {
      actorId: session.userId,
      actorRole: session.role,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const parsed = notificationQuerySchema.safeParse({
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      isRead: searchParams.get("isRead") || undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Query notifikasi tidak valid.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        400,
      );
    }

    const result = await getNotifications(session.userId, parsed.data);

    return successResponse(result.data, result.meta);
  } catch (error: unknown) {
    console.error("GET /api/v1/notifications error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses ke notifikasi."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal saat memuat notifikasi.", undefined, 500);
  }
}
