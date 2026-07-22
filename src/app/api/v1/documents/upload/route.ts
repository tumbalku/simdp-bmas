import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { uploadDocumentRecord } from "@/modules/document/server";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.FILE_UPLOAD, {
      actorId: session.userId,
      actorRole: session.role,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await request.formData();
    const documentTypeId = formData.get("documentTypeId") as string;
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || undefined;
    const documentNumber = (formData.get("documentNumber") as string) || undefined;
    const issueDate = (formData.get("issueDate") as string) || undefined;
    const expiryDate = (formData.get("expiryDate") as string) || undefined;

    if (!documentTypeId || !file) {
      return errorResponse("VALIDATION_ERROR", "Field documentTypeId dan file wajib diisi.", undefined, 400);
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;

    const result = await uploadDocumentRecord(
      {
        documentTypeId,
        file,
        title,
        documentNumber,
        issueDate,
        expiryDate,
      },
      session,
      ipAddress
    );

    return successResponse(result);
  } catch (error: unknown) {
    console.error("Document upload route error:", error);
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.details, error.status);
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
