import { NextRequest } from "next/server";
import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/api-response";
import { env } from "@/lib/env";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { cleanupExpiredSecurityLogs } from "@/modules/security/server";

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}

async function handleCleanup(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.INTERNAL);
    if (rateLimitResponse) return rateLimitResponse;

    const cronHeader = request.headers.get("x-cron-secret");
    const authHeader = request.headers.get("authorization");

    let headerSecret: string | null = null;
    if (cronHeader) {
      headerSecret = cronHeader;
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      headerSecret = authHeader.substring(7);
    }

    let isAuthorized = false;
    if (headerSecret && env.CRON_SECRET) {
      const secretBuf = Buffer.from(headerSecret);
      const expectedBuf = Buffer.from(env.CRON_SECRET);
      const maxLen = Math.max(secretBuf.length, expectedBuf.length);
      const paddedSecret = Buffer.concat([secretBuf], maxLen);
      const paddedExpected = Buffer.concat([expectedBuf], maxLen);

      const match = crypto.timingSafeEqual(paddedSecret, paddedExpected);
      isAuthorized = match && secretBuf.length === expectedBuf.length;
    }

    if (!isAuthorized) {
      return errorResponse(
        "UNAUTHENTICATED",
        "Cron secret tidak valid atau tidak disertakan.",
        undefined,
        401
      );
    }

    const result = await cleanupExpiredSecurityLogs();

    return successResponse(result);
  } catch (error: unknown) {
    console.error("Cron security log cleanup error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
