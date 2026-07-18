import { NextRequest } from "next/server";
import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/api-response";
import { env } from "@/lib/env";
import { processExpiredDocumentsAndReminders } from "@/modules/document/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let headerSecret = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerSecret = authHeader.substring(7);
    }

    const secret = headerSecret;

    let isAuthorized = false;
    if (secret && env.CRON_SECRET) {
      const secretBuf = Buffer.from(secret);
      const expectedBuf = Buffer.from(env.CRON_SECRET);
      if (secretBuf.length === expectedBuf.length) {
        isAuthorized = crypto.timingSafeEqual(secretBuf, expectedBuf);
      } else {
        // Run a dummy comparison to maintain constant time
        crypto.timingSafeEqual(secretBuf, secretBuf);
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      return errorResponse(
        "UNAUTHENTICATED",
        "Cron secret tidak valid atau tidak disertakan.",
        undefined,
        401
      );
    }

    const result = await processExpiredDocumentsAndReminders();

    return successResponse(result);
  } catch (error: unknown) {
    console.error("Cron expiry check error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
