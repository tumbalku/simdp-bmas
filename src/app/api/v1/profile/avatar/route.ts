import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { getCurrentProfile } from "@/modules/employee/server";

const SAFE_PROFILE_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

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
