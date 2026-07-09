import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file) {
      return errorResponse("VALIDATION_ERROR", "Parameter file wajib diisi.", undefined, 400);
    }

    // 1. Fetch document record in DB to enforce RBAC/ownership
    const doc = await prisma.documentRecord.findFirst({
      where: {
        filePath: { endsWith: file },
        deletedAt: null,
      },
      include: {
        owner: true,
      },
    });

    if (!doc) {
      return errorResponse("NOT_FOUND", "Dokumen tidak ditemukan atau terhapus.", undefined, 404);
    }

    // Enforce ownership
    if (session.role === "EMPLOYEE") {
      if (doc.owner.userId !== session.userId) {
        return errorResponse("OWNERSHIP_REQUIRED", "Anda tidak memiliki akses ke dokumen ini.", undefined, 403);
      }
    }

    // 2. Read local file and stream
    const fullPath = path.join(process.cwd(), "uploads", file);

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const response = new NextResponse(fileBuffer);
      response.headers.set("Content-Type", doc.mimeType || "application/octet-stream");
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
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
