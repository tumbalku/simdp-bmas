import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security";
import { createPost, getPosts } from "@/modules/post/server";
import { createPostSchema, postListQuerySchema } from "@/modules/post/schemas";
import { formatValidationDetails, getActorInfo, mapPostError } from "../_lib";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";

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

    const { searchParams } = new URL(request.url);
    const parsed = postListQuerySchema.safeParse({
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Query pengumuman tidak valid.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        400,
      );
    }

    const result = await getPosts(parsed.data || {});

    return successResponse(result.data, result.meta);
  } catch (error: unknown) {
    console.error("GET /api/v1/posts/manage error:", error);

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
      "Terjadi kesalahan internal saat memuat pengumuman.",
      undefined,
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth("STAFF");
    const rateLimitResponse = await enforceApiRateLimit(
      request,
      API_RATE_LIMIT_CATEGORY.FILE_UPLOAD,
      { actorId: session.userId, actorRole: session.role },
    );
    if (rateLimitResponse) return rateLimitResponse;

    const contentType = request.headers.get("content-type") ?? "";
    let body: unknown = null;
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const payload = formData.get("payload");
      try {
        body = typeof payload === "string" ? JSON.parse(payload) : null;
      } catch {
        body = null;
      }
      files = formData.getAll("files").filter((item): item is File => item instanceof File);
    } else {
      body = await request.json().catch(() => null);
    }

    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Input pengumuman tidak valid.",
        formatValidationDetails(parsed.error),
        400,
      );
    }

    const result = await createPost({
      authorId: session.userId,
      ...parsed.data,
      targets: parsed.data.targets ?? {},
      files,
    });

    const actor = await getActorInfo(session);
    await logActivity({
      actorId: session.userId,
      actorName: actor.name,
      actorRole: actor.role,
      eventType:
        parsed.data.status === "PUBLISHED"
          ? SECURITY_EVENT_TYPE.POST_PUBLISHED
          : SECURITY_EVENT_TYPE.POST_DRAFT_SAVED,
      resource: `POST:${result.id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: {
        title: result.title,
        visibilityType: result.visibilityType,
        status: result.status,
      },
    });

    return successResponse(result, undefined, 201);
  } catch (error: unknown) {
    console.error("POST /api/v1/posts/manage error:", error);

    if (error instanceof AppError) {
      return errorResponse(error.code, mapPostError(error), error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Terjadi kesalahan internal saat menyimpan pengumuman.",
      undefined,
      500,
    );
  }
}
