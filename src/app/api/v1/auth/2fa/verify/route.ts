import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { verifyTwoFactorLoginAction } from "@/modules/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await verifyTwoFactorLoginAction(body);
    if (!result.ok) {
      const status = result.error.code === "RATE_LIMITED" ? 429 : result.error.code === "VALIDATION_ERROR" ? 400 : 401;
      return errorResponse(result.error.code, result.error.message, undefined, status);
    }
    return successResponse(result.data);
  } catch {
    return errorResponse("INVALID_JSON", "Request body tidak valid.", undefined, 400);
  }
}
