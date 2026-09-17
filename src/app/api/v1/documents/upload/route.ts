import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { replaceDocumentFile, uploadDocumentRecord } from "@/modules/document/server";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";

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
    const documentTypeId = formData.get("documentTypeId") as string;
    const documentId = (formData.get("documentId") as string) || undefined;
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || undefined;
    const documentNumber = (formData.get("documentNumber") as string) || undefined;
    const issueDate = (formData.get("issueDate") as string) || undefined;
    const expiryDate = (formData.get("expiryDate") as string) || undefined;

    if (!documentTypeId || !file) {
      return errorResponse("VALIDATION_ERROR", "Field documentTypeId dan file wajib diisi.", undefined, 400);
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;

    const result = documentId
      ? await replaceDocumentFile(
          {
            documentId,
            file,
            title,
            documentNumber,
            issueDate,
            expiryDate,
          },
          session,
          ipAddress
        )
      : await uploadDocumentRecord(
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
      const message =
        error.code === "UNAUTHENTICATED"
          ? "User belum login"
          : error.code === "FORBIDDEN"
            ? "Akses ditolak."
            : error.code === "VALIDATION_ERROR"
              ? "Input dokumen tidak valid."
              : error.code === "NOT_FOUND"
                ? "Sumber data tidak ditemukan."
              : error.status >= 400 && error.status < 500
                ? error.message
                : "Terjadi kesalahan saat upload dokumen.";
      return errorResponse(error.code, message, error.details, error.status);
    }
    const httpStatus = getHttpStatusFromError(error);
    if (httpStatus === 413) {
      return errorResponse("PAYLOAD_TOO_LARGE", "Ukuran file melebihi batas yang diizinkan.", undefined, 413);
    }
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED") {
        return errorResponse("UNAUTHENTICATED", "User belum login", undefined, 401);
      }
      return errorResponse(
        "INTERNAL_ERROR",
        "Terjadi kesalahan internal saat upload dokumen.",
        undefined,
        500,
      );
    }
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
