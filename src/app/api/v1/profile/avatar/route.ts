import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { storage } from "@/lib/storage";
import { getActorDisplayName, getCurrentProfile, uploadProfileAvatar } from "@/modules/employee/server";

const SAFE_PROFILE_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function mapProfileAvatarUploadError(error: AppError) {
  if (error.code === "UNAUTHENTICATED") return "User belum login";
  if (error.code === "FORBIDDEN") return "Akses ditolak.";
  return error.message;
}

function getHttpStatusFromError(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const status = "status" in error ? Number((error as { status?: unknown }).status) : NaN;
  const statusCode = "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : NaN;
  if (Number.isInteger(status) && status >= 400) return status;
  if (Number.isInteger(statusCode) && statusCode >= 400) return statusCode;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.FILE_UPLOAD, {
      actorId: session.userId,
      actorRole: session.role,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("VALIDATION_ERROR", "Foto profil wajib dipilih.", undefined, 400);
    }

    const actorName = await getActorDisplayName(session.userId, "User");
    const result = await uploadProfileAvatar(
      { file },
      { userId: session.userId, role: session.role },
      actorName,
    );

    return successResponse(result);
  } catch (error: unknown) {
    console.error("Profile avatar upload route error:", error);
    if (error instanceof AppError) {
      return errorResponse(error.code, mapProfileAvatarUploadError(error), error.details, error.status);
    }
    const httpStatus = getHttpStatusFromError(error);
    if (httpStatus === 413) {
      return errorResponse("PAYLOAD_TOO_LARGE", "Ukuran foto profil melebihi batas yang diizinkan.", undefined, 413);
    }
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return errorResponse("UNAUTHENTICATED", "User belum login", undefined, 401);
    }
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal saat upload foto profil.", undefined, 500);
  }
}

function normalizeProfilePath(file: string) {
  if (file.includes("\0")) return null;

  const normalized = path.posix.normalize(file.replace(/\\/g, "/")).replace(/^\/+/, "");
  if (!normalized.startsWith("profile/") || normalized.startsWith("../") || normalized.includes("/../")) {
    return null;
  }

  return normalized;
}

function normalizeStoredPath(file: string | null | undefined) {
  if (!file) return null;
  return file
    .split("?")[0]
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "")
    .replace(/^supabase\//, "")
    .replace(/^s3\//, "");
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const requestedFile = searchParams.get("file");

    if (!requestedFile) {
      return errorResponse("VALIDATION_ERROR", "Parameter file wajib diisi.", undefined, 400);
    }

    const safeFile = normalizeProfilePath(requestedFile);
    if (!safeFile) {
      return errorResponse("FORBIDDEN", "Path foto profil tidak valid.", undefined, 403);
    }

    const employee = await getCurrentProfile(session.userId);
    const storedAvatarPath = normalizeStoredPath(employee?.avatarUrl);
    if (!storedAvatarPath || storedAvatarPath !== safeFile) {
      return errorResponse("FORBIDDEN", "Anda tidak memiliki akses ke foto profil ini.", undefined, 403);
    }

    if (employee?.avatarUrl?.startsWith("supabase/") || employee?.avatarUrl?.startsWith("s3/")) {
      const temporaryUrl = await storage.getTemporaryUrl(employee.avatarUrl);
      return NextResponse.redirect(temporaryUrl);
    }

    const uploadRoot = path.resolve(process.cwd(), "uploads");
    const fullPath = path.resolve(uploadRoot, safeFile);
    if (!fullPath.startsWith(`${uploadRoot}${path.sep}`)) {
      return errorResponse("FORBIDDEN", "Path foto profil tidak valid.", undefined, 403);
    }

    const fileBuffer = await fs.readFile(fullPath);
    const mimeType = SAFE_PROFILE_MIME_TYPES[path.extname(safeFile).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Profile avatar streaming error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHENTICATED") {
      return errorResponse("UNAUTHENTICATED", "User belum login", undefined, 401);
    }
    return errorResponse("NOT_FOUND", "Foto profil tidak ditemukan.", undefined, 404);
  }
}
