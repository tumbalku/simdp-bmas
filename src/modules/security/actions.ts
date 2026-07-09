/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requireAuth } from "@/lib/auth";
import { getSecurityLogs } from "@/modules/security/service";

export async function getSecurityLog(filter: {
  page?: number;
  pageSize?: number;
  search?: string;
  eventType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    await requireAuth("ADMIN"); // Admin only

    const result = await getSecurityLogs(filter);

    return { ok: true as const, ...result };
  } catch (error: any) {
    console.error("getSecurityLog Action error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}
