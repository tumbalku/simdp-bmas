import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { generateDownloadUrl } from "@/modules/document/service";
import { AppError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const url = await generateDownloadUrl(id, session);

    return successResponse({ url });
  } catch (error: unknown) {
    console.error("Document download route error:", error);
    if (error instanceof AppError) {
      const message = error.message === "OWNERSHIP_REQUIRED" ? "Anda tidak memiliki akses ke dokumen ini." : error.message;
      return errorResponse(error.code, message, error.details, error.status);
    }
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED") {
        return errorResponse("UNAUTHENTICATED", "User belum login", undefined, 401);
      }
      return errorResponse("INTERNAL_ERROR", error.message, undefined, 500);
    }
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
