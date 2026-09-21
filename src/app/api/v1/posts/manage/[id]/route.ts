import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security";
import { archivePost, deletePost, getPostById, updatePost } from "@/modules/post/server";
import { postIdSchema, updatePostSchema } from "@/modules/post/schemas";
import { formatValidationDetails, getActorInfo, mapPostError } from "../../_lib";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function assertCanManagePost(post: { authorId: string }, session: { userId: string; role: string }) {
  if (post.authorId !== session.userId && session.role !== "ADMIN") {
    throw new AppError("FORBIDDEN", "Hanya pembuat atau admin yang dapat mengelola pengumuman ini.", 403);
  }
}

function resolvePostUpdateEventType(nextStatus: string, previousStatus: string) {
  if (nextStatus === "ARCHIVED" && previousStatus !== "ARCHIVED") {
    return SECURITY_EVENT_TYPE.POST_ARCHIVED;
  }
  if (nextStatus === "PUBLISHED" && previousStatus !== "PUBLISHED") {
    return SECURITY_EVENT_TYPE.POST_PUBLISHED;
  }
  return SECURITY_EVENT_TYPE.POST_DRAFT_SAVED;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth("STAFF");
    const rateLimitResponse = await enforceApiRateLimit(
      request,
      API_RATE_LIMIT_CATEGORY.NOTIFICATION_READ,
      { actorId: session.userId, actorRole: session.role },
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    const data = await getPostById(id);
    if (!data) {
      return errorResponse("NOT_FOUND", "Pengumuman tidak ditemukan.", undefined, 404);
    }

    return successResponse(data);
  } catch (error: unknown) {
    console.error("GET /api/v1/posts/manage/[id] error:", error);

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth("STAFF");
    const rateLimitResponse = await enforceApiRateLimit(
      request,
      API_RATE_LIMIT_CATEGORY.FILE_UPLOAD,
      { actorId: session.userId, actorRole: session.role },
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const parsedId = postIdSchema.safeParse({ id });

    if (!parsedId.success) {
      return errorResponse("VALIDATION_ERROR", "ID pengumuman tidak valid.", undefined, 400);
    }

    const existing = await getPostById(parsedId.data.id);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Pengumuman tidak ditemukan.", undefined, 404);
    }
    assertCanManagePost(existing, session);

    const body = await request.json().catch(() => null);
    const actor = await getActorInfo(session);

    if (body && typeof body === "object" && (body as { action?: unknown }).action === "archive") {
      const result = await archivePost(parsedId.data.id);
      await logActivity({
        actorId: session.userId,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: SECURITY_EVENT_TYPE.POST_ARCHIVED,
        resource: `POST:${result.id}`,
        status: SECURITY_LOG_STATUS.SUCCESS,
        metadata: { title: result.title },
      });

      return successResponse(result);
    }

    const parsed = updatePostSchema.safeParse({ ...(body as Record<string, unknown> | null), id: parsedId.data.id });
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Input pengumuman tidak valid.",
        formatValidationDetails(parsed.error),
        400,
      );
    }

    const { id: postId, ...payload } = parsed.data;
    const result = await updatePost({ id: postId, ...payload, targets: payload.targets ?? {} });
    await logActivity({
      actorId: session.userId,
      actorName: actor.name,
      actorRole: actor.role,
      eventType: resolvePostUpdateEventType(parsed.data.status, existing.status),
      resource: `POST:${result.id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: {
        title: result.title,
        visibilityType: result.visibilityType,
        status: result.status,
      },
    });

    return successResponse(result);
  } catch (error: unknown) {
    console.error("PATCH /api/v1/posts/manage/[id] error:", error);

    if (error instanceof AppError) {
      return errorResponse(error.code, mapPostError(error), error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Terjadi kesalahan internal saat memperbarui pengumuman.",
      undefined,
      500,
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth("STAFF");
    const rateLimitResponse = await enforceApiRateLimit(
      request,
      API_RATE_LIMIT_CATEGORY.FILE_UPLOAD,
      { actorId: session.userId, actorRole: session.role },
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const parsedId = postIdSchema.safeParse({ id });

    if (!parsedId.success) {
      return errorResponse("VALIDATION_ERROR", "ID pengumuman tidak valid.", undefined, 400);
    }

    const existing = await getPostById(parsedId.data.id);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Pengumuman tidak ditemukan.", undefined, 404);
    }
    assertCanManagePost(existing, session);

    await deletePost(parsedId.data.id);

    const actor = await getActorInfo(session);
    await logActivity({
      actorId: session.userId,
      actorName: actor.name,
      actorRole: actor.role,
      eventType: SECURITY_EVENT_TYPE.POST_DELETED,
      resource: `POST:${parsedId.data.id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { title: existing.title },
    });

    return successResponse({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/v1/posts/manage/[id] error:", error);

    if (error instanceof AppError) {
      return errorResponse(error.code, mapPostError(error), error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Terjadi kesalahan internal saat menghapus pengumuman.",
      undefined,
      500,
    );
  }
}
