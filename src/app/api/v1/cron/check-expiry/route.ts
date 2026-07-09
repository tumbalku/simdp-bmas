/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { env } from "@/lib/env";
import { processExpiredDocumentsAndReminders } from "@/modules/document/service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let headerSecret = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerSecret = authHeader.substring(7);
    }

    const secret = headerSecret;

    if (!secret || secret !== env.CRON_SECRET) {
      return errorResponse(
        "UNAUTHENTICATED",
        "Cron secret tidak valid atau tidak disertakan.",
        undefined,
        401
      );
    }

    const result = await processExpiredDocumentsAndReminders();

    return successResponse(result);
  } catch (error: any) {
    console.error("Cron expiry check error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
