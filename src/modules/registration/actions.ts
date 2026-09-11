"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { requireAuth } from "@/lib/auth";
import { incrementSharedRateLimitBucket } from "@/lib/rate-limit-store";
import { AppError, handleActionError } from "@/lib/errors";
import { ROUTES } from "@/constants";
import { getActorDisplayName } from "@/modules/employee/server";
import {
  approveRegistrationRequest,
  listRegistrationRequests,
  rejectRegistrationRequest,
  submitRegistration,
  verifyRegistrationOtp,
} from "./service";
import {
  listRegistrationRequestsSchema,
  reviewRegistrationSchema,
  submitRegistrationSchema,
  verifyRegistrationOtpSchema,
} from "./schema";

const REGISTRATION_RATE_WINDOW_MS = 15 * 60 * 1000;

async function enforceRegistrationRateLimit(operation: "SUBMIT" | "VERIFY", email: string) {
  const requestHeaders = await headers();
  // The trusted deployment proxy must overwrite forwarded IP headers.
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip") || "unknown";
  const limits = [{ scope: "IP", value: ip, limit: 15 }, { scope: "EMAIL", value: email, limit: 5 }];

  for (const entry of limits) {
    const digest = createHash("sha256").update(entry.value).digest("hex");
    const bucket = await incrementSharedRateLimitBucket({
      key: `REGISTRATION_${operation}:${entry.scope}:${digest}`,
      category: `REGISTRATION_${operation}`,
      windowMs: REGISTRATION_RATE_WINDOW_MS,
    });
    if (bucket.count > entry.limit) {
      throw new AppError("RATE_LIMITED", "Terlalu banyak percobaan registrasi. Coba lagi 15 menit kemudian.", 429);
    }
  }
}

export async function submitRegistrationAction(data: unknown) {
  try {
    const parsed = submitRegistrationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((issue) => issue.message).join(". "),
          details: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      };
    }

    await enforceRegistrationRateLimit("SUBMIT", parsed.data.email);
    const result = await submitRegistration(parsed.data);
    return { ok: true as const, data: result };
  } catch (error: unknown) {
    if (!(error instanceof AppError)) console.error("submitRegistrationAction error:", error);
    return handleActionError(error, { defaultMessage: "Registrasi gagal diproses." });
  }
}

export async function verifyRegistrationOtpAction(data: unknown) {
  try {
    const parsed = verifyRegistrationOtpSchema.safeParse(data);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Kode OTP tidak valid.",
          details: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      };
    }

    await enforceRegistrationRateLimit("VERIFY", parsed.data.email);
    const result = await verifyRegistrationOtp(parsed.data);
    return { ok: true as const, data: result };
  } catch (error: unknown) {
    if (!(error instanceof AppError)) console.error("verifyRegistrationOtpAction error:", error);
    return handleActionError(error, { defaultMessage: "Verifikasi OTP gagal diproses." });
  }
}

export async function listRegistrationRequestsAction(filter?: unknown) {
  try {
    await requireAuth("ADMIN");
    const parsed = listRegistrationRequestsSchema.partial().safeParse(filter ?? {});
    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Filter registrasi tidak valid." } };
    }

    const result = await listRegistrationRequests(parsed.data);
    return { ok: true as const, data: result };
  } catch (error: unknown) {
    if (!(error instanceof AppError)) console.error("listRegistrationRequestsAction error:", error);
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
  }
}

export async function approveRegistrationRequestAction(data: unknown) {
  try {
    const session = await requireAuth("ADMIN");
    const parsed = reviewRegistrationSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Input review tidak valid." } };
    }

    const actorName = await getActorDisplayName(session.userId, "Admin");
    const result = await approveRegistrationRequest({
      id: parsed.data.id,
      actor: { userId: session.userId, name: actorName, role: session.role },
    });
    revalidatePath(ROUTES.registrationRequests);
    revalidatePath(ROUTES.masterDataEmployees);
    return { ok: true as const, data: result };
  } catch (error: unknown) {
    if (!(error instanceof AppError)) console.error("approveRegistrationRequestAction error:", error);
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
  }
}

export async function rejectRegistrationRequestAction(data: unknown) {
  try {
    const session = await requireAuth("ADMIN");
    const parsed = reviewRegistrationSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Input review tidak valid." } };
    }

    const actorName = await getActorDisplayName(session.userId, "Admin");
    const result = await rejectRegistrationRequest({
      id: parsed.data.id,
      actor: { userId: session.userId, name: actorName, role: session.role },
    });
    revalidatePath(ROUTES.registrationRequests);
    return { ok: true as const, data: result };
  } catch (error: unknown) {
    if (!(error instanceof AppError)) console.error("rejectRegistrationRequestAction error:", error);
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
  }
}
