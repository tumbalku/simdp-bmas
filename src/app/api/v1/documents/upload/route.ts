/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { uploadDocumentRecord } from "@/modules/document/service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

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
  } catch (error: any) {
    console.error("Document upload route error:", error);
    if (error.message === "UNAUTHENTICATED") {
      return errorResponse("UNAUTHENTICATED", "User belum login", undefined, 401);
    }
    if (
      error.message.includes("wajib diisi") ||
      error.message.includes("Format tanggal YYYY-MM-DD") ||
      error.message.includes("tidak diizinkan")
    ) {
      return errorResponse("VALIDATION_ERROR", error.message, undefined, 400);
    }
    if (error.message.includes("melebihi batas")) {
      return errorResponse("PAYLOAD_TOO_LARGE", error.message, undefined, 413);
    }
    if (error.message.includes("tidak dikenal") || error.message.includes("tidak diizinkan")) {
      return errorResponse("UNSUPPORTED_MEDIA_TYPE", error.message, undefined, 415);
    }
    return errorResponse("INTERNAL_ERROR", error.message || "Terjadi kesalahan internal", undefined, 500);
  }
}
