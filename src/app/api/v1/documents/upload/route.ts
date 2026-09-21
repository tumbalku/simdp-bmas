import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { replaceDocumentFile, uploadDocumentRecord } from "@/modules/document/server";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

function getHttpStatusFromError(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const status = "status" in error ? Number((error as { status?: unknown }).status) : NaN;
  const statusCode = "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : NaN;
  if (Number.isInteger(status) && status >= 400) return status;
  if (Number.isInteger(statusCode) && statusCode >= 400) return statusCode;
  return null;
}

/**
 * Menerjemahkan error yang dilempar trigger database (`validate_document_fields`,
 * `handle_document_replacement`) menjadi `AppError` 400 yang informatif.
 * Tanpa ini, exception mentah PostgreSQL menjadi 500 generik (REVIEW.md H-2).
 */
function translateDatabaseTriggerError(error: unknown): AppError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  const message = error.message ?? "";

  if (error.code === "P2002") {
    return new AppError("CONFLICT", "Data dokumen tersebut sudah ada di sistem.", 409);
  }

  const knownTriggerMessages: Array<{ match: string; message: string }> = [
    { match: "wajib diisi", message: "Field wajib dokumen tidak lengkap sesuai jenis dokumen." },
    { match: "tidak boleh diisi", message: "Field tidak diizinkan untuk jenis dokumen ini." },
    { match: "hanya boleh diunggah", message: "Jenis dokumen ini tidak dapat diunggah oleh peran Anda." },
    { match: "tidak dapat digantikan", message: "Dokumen final tidak dapat diganti oleh non-admin/staff." },
    { match: "hanya dapat mengunggah", message: "Dokumen hanya dapat diunggah untuk pemiliknya." },
  ];

  const triggerMessage = knownTriggerMessages.find((item) => message.includes(item.match));
  if (triggerMessage) {
    return new AppError("VALIDATION_ERROR", triggerMessage.message, 400);
  }

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
    const periodStartDate = (formData.get("periodStartDate") as string) || undefined;
    const periodEndDate = (formData.get("periodEndDate") as string) || undefined;

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
            periodStartDate,
            periodEndDate,
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
            periodStartDate,
            periodEndDate,
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
    const triggerError = translateDatabaseTriggerError(error);
    if (triggerError) {
      return errorResponse(
        triggerError.code,
        triggerError.message,
        triggerError.details,
        triggerError.status,
      );
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
