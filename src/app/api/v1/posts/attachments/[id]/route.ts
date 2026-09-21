import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { storage } from "@/lib/storage";
import { normalizeStoragePath } from "@/lib/storage/path";
import { getPostAttachmentForUser } from "@/modules/post/server";

const SAFE_INLINE_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const attachment = await getPostAttachmentForUser({
      attachmentId: id,
      context: {
        userId: session.userId,
        role: session.role,
        employeeId: session.employeeId ?? null,
        workplaceId: null,
        employeeGroupId: null,
      },
    });

    if (env.STORAGE_PROVIDER !== "local") {
      const url = await storage.getTemporaryUrl(attachment.filePath);
      return NextResponse.redirect(url);
    }

    const safeFile = normalizeStoragePath(attachment.filePath);
    const uploadRoot = path.resolve(process.cwd(), "uploads");
    const fullPath = path.resolve(uploadRoot, safeFile);
    if (!fullPath.startsWith(`${uploadRoot}${path.sep}`)) {
      return errorResponse("FORBIDDEN", "Path lampiran tidak valid.", undefined, 403);
    }

    const fileBuffer = await fs.readFile(fullPath);
    const response = new NextResponse(fileBuffer);
    const mimeType = SAFE_INLINE_MIME_TYPES.has(attachment.mimeType)
      ? attachment.mimeType
      : "application/octet-stream";
    response.headers.set("Content-Type", mimeType);
    response.headers.set("Content-Disposition", `inline; filename="${attachment.fileName}"`);
    return response;
  } catch (error) {
    console.error("GET /api/v1/posts/attachments/[id] error:", error);

    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.details, error.status);
    }

    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return errorResponse("UNAUTHENTICATED", "User belum login.", undefined, 401);
    }

    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan saat membuka lampiran.", undefined, 500);
  }
}
