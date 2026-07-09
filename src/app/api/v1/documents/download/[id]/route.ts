/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { generateDownloadUrl } from "@/modules/document/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const url = await generateDownloadUrl(id, session);

    return successResponse({ url });
  } catch (error: any) {
    console.error("Document download route error:", error);
    if (error.message === "UNAUTHENTICATED") {
      return errorResponse("UNAUTHENTICATED", "User belum login", undefined, 401);
    }
    if (error.message === "OWNERSHIP_REQUIRED") {
      return errorResponse("OWNERSHIP_REQUIRED", "Anda tidak memiliki akses ke dokumen ini.", undefined, 403);
    }
    if (error.message.includes("tidak ditemukan")) {
      return errorResponse("NOT_FOUND", "Dokumen tidak ditemukan atau terhapus.", undefined, 404);
    }
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
