/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requireAuth } from "@/lib/auth";
import { getDashboardStats } from "@/modules/statistics/service";

export async function getStatistics(filter: { workplaceId?: string }) {
  try {
    await requireAuth("STAFF"); // Minimum role STAFF+

    const result = await getDashboardStats(filter || {});

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("getStatistics Action error:", error);
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
