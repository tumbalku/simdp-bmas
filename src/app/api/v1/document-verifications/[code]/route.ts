import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { documentVerificationCodeSchema, verifyDocumentCode } from "@/modules/document-verification/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.DOCUMENT_VERIFY);
  if (rateLimitResponse) return rateLimitResponse;

  const { code } = await params;
  const parsed = documentVerificationCodeSchema.safeParse(code);

  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Kode verifikasi dokumen tidak valid.",
      parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      400,
    );
  }

  const verification = await verifyDocumentCode(parsed.data);
  return successResponse(verification);
}
