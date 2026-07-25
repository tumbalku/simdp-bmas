import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getLocalStreamDocument } from "@/modules/document/server";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";

const SAFE_INLINE_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

function normalizeLocalStoragePath(file: string) {
  if (file.includes("\0")) return null;

  const normalized = path.posix.normalize(file.replace(/\\/g, "/")).replace(/^\/+/, "");
  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    return null;
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.FILE_DOWNLOAD, {
      actorId: session.userId,
      actorRole: session.role,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file) {
      return errorResponse("VALIDATION_ERROR", "Parameter file wajib diisi.", undefined, 400);
    }

    const safeFile = normalizeLocalStoragePath(file);
    if (!safeFile) {
      return errorResponse("FORBIDDEN", "Path file tidak valid.", undefined, 403);
    }

    const doc = await getLocalStreamDocument(safeFile, session);

    const uploadRoot = path.resolve(process.cwd(), "uploads");
    const fullPath = path.resolve(uploadRoot, safeFile);
    if (!fullPath.startsWith(`${uploadRoot}${path.sep}`)) {
      return errorResponse("FORBIDDEN", "Path file tidak valid.", undefined, 403);
    }

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const response = new NextResponse(fileBuffer);
      const mimeType = doc.mimeType && SAFE_INLINE_MIME_TYPES.has(doc.mimeType) ? doc.mimeType : "application/octet-stream";
      response.headers.set("Content-Type", mimeType);
      response.headers.set("Content-Disposition", `inline; filename="${doc.fileName}"`);
      return response;
    } catch {
      return errorResponse("NOT_FOUND", "File fisik tidak ditemukan di server.", undefined, 404);
    }
  } catch (error: unknown) {
    console.error("Local file streaming error:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage === "UNAUTHENTICATED") {
      return errorResponse("UNAUTHENTICATED", "User belum login", undefined, 401);
    }
    if (errorMessage === "OWNERSHIP_REQUIRED") {
      return errorResponse("OWNERSHIP_REQUIRED", "Anda tidak memiliki akses ke dokumen ini.", undefined, 403);
    }
    if (errorMessage.includes("tidak ditemukan")) {
      return errorResponse("NOT_FOUND", "Dokumen tidak ditemukan atau terhapus.", undefined, 404);
    }
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
