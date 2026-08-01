import crypto from "crypto";
import type { NextRequest } from "next/server";

import { errorResponse } from "@/lib/api-response";
import {
  claimSharedRateLimitLimitedLog,
  incrementSharedRateLimitBucket,
} from "@/lib/rate-limit-store";
import {
  logActivity,
  SECURITY_ACTOR_ROLE,
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
} from "@/modules/security/server";

export const API_RATE_LIMIT_CATEGORY = {
  AUTH_PUBLIC: "AUTH_PUBLIC",
  AUTH_REFRESH: "AUTH_REFRESH",
  REALTIME_AUTH: "REALTIME_AUTH",
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_DOWNLOAD: "FILE_DOWNLOAD",
  EXPORT: "EXPORT",
  DOCUMENT_VERIFY: "DOCUMENT_VERIFY",
  INTERNAL: "INTERNAL",
  STATISTICS_READ: "STATISTICS_READ",
  NOTIFICATION_READ: "NOTIFICATION_READ",
} as const;

export type ApiRateLimitCategory = (typeof API_RATE_LIMIT_CATEGORY)[keyof typeof API_RATE_LIMIT_CATEGORY];

type ApiRateLimitConfig = {
  limit: number;
  windowMs: number;
};

type ApiRateLimitActor = {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  scope?: string | null;
};

export const API_RATE_LIMIT_CONFIG: Record<ApiRateLimitCategory, ApiRateLimitConfig> = {
  AUTH_PUBLIC: { limit: 15, windowMs: 15 * 60 * 1000 },
  AUTH_REFRESH: { limit: 30, windowMs: 60 * 1000 },
  REALTIME_AUTH: { limit: 60, windowMs: 60 * 1000 },
  FILE_UPLOAD: { limit: 10, windowMs: 15 * 60 * 1000 },
  FILE_DOWNLOAD: { limit: 60, windowMs: 60 * 1000 },
  EXPORT: { limit: 10, windowMs: 15 * 60 * 1000 },
  DOCUMENT_VERIFY: { limit: 60, windowMs: 60 * 1000 },
  INTERNAL: { limit: 30, windowMs: 60 * 1000 },
  STATISTICS_READ: { limit: 120, windowMs: 60 * 1000 },
  NOTIFICATION_READ: { limit: 120, windowMs: 60 * 1000 },
};

export function getClientIp(request: Request) {
  // Deployment must ensure these headers are set by a trusted proxy and not
  // directly spoofable by clients. See context/technical/environment.md.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function buildRateLimitResource(category: ApiRateLimitCategory, key: string) {
  const digest = crypto.createHash("sha256").update(key).digest("hex").slice(0, 24);
  return `RateLimit:${category}:${digest}`;
}

function normalizeRateLimitScope(scope?: string | null) {
  if (!scope) return "global";

  return (
    scope
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "global"
  );
}

function buildRateLimitKey(category: ApiRateLimitCategory, ipAddress: string, actor?: ApiRateLimitActor) {
  const actorKey = actor?.actorId ? `user:${actor.actorId}` : "public";
  const scopeKey = `scope:${normalizeRateLimitScope(actor?.scope)}`;
  return `${category}:${scopeKey}:${actorKey}:ip:${ipAddress}`;
}

export async function enforceApiRateLimit(
  request: NextRequest | Request,
  category: ApiRateLimitCategory,
  actor?: ApiRateLimitActor,
) {
  const config = API_RATE_LIMIT_CONFIG[category];
  const now = Date.now();
  const ipAddress = getClientIp(request);
  const scope = normalizeRateLimitScope(actor?.scope);
  const key = buildRateLimitKey(category, ipAddress, actor);
  const resource = buildRateLimitResource(category, key);

  const bucket = await incrementSharedRateLimitBucket({
    key: resource,
    category,
    windowMs: config.windowMs,
    now: new Date(now),
  });

  if (bucket.count <= config.limit) {
    return null;
  }

  if (await claimSharedRateLimitLimitedLog(resource, new Date(now))) {
    await logActivity({
      actorId: actor?.actorId ?? null,
      actorName: actor?.actorName ?? (actor?.actorId ? "User" : "System"),
      actorRole: actor?.actorRole ?? SECURITY_ACTOR_ROLE.PUBLIC,
      eventType: SECURITY_EVENT_TYPE.API_RATE_LIMIT_CHECK,
      resource,
      ipAddress,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: {
        category,
        limit: config.limit,
        scope,
        windowMs: config.windowMs,
        reason: "RATE_LIMITED",
      },
    });
  }

  return errorResponse(
    "RATE_LIMITED",
    "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.",
    undefined,
    429,
    {
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now) / 1000)),
      category,
    },
  );
}
