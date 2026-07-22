import crypto from "crypto";
import type { NextRequest } from "next/server";

import { errorResponse } from "@/lib/api-response";
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
  INTERNAL: "INTERNAL",
  STATISTICS_READ: "STATISTICS_READ",
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
};

export const API_RATE_LIMIT_CONFIG: Record<ApiRateLimitCategory, ApiRateLimitConfig> = {
  AUTH_PUBLIC: { limit: 5, windowMs: 15 * 60 * 1000 },
  AUTH_REFRESH: { limit: 30, windowMs: 60 * 1000 },
  REALTIME_AUTH: { limit: 60, windowMs: 60 * 1000 },
  FILE_UPLOAD: { limit: 10, windowMs: 15 * 60 * 1000 },
  FILE_DOWNLOAD: { limit: 60, windowMs: 60 * 1000 },
  EXPORT: { limit: 10, windowMs: 15 * 60 * 1000 },
  INTERNAL: { limit: 30, windowMs: 60 * 1000 },
  STATISTICS_READ: { limit: 120, windowMs: 60 * 1000 },
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
  limitedLoggedAt?: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getBucket(key: string, windowMs: number, now: number) {
  const existing = buckets.get(key);
  if (existing && existing.resetAt > now) {
    return existing;
  }

  const bucket: RateLimitBucket = { count: 0, resetAt: now + windowMs };
  buckets.set(key, bucket);
  return bucket;
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 1000) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

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

function buildRateLimitKey(category: ApiRateLimitCategory, ipAddress: string, actor?: ApiRateLimitActor) {
  const actorKey = actor?.actorId ? `user:${actor.actorId}` : "public";
  return `${category}:${actorKey}:ip:${ipAddress}`;
}

export async function enforceApiRateLimit(
  request: NextRequest | Request,
  category: ApiRateLimitCategory,
  actor?: ApiRateLimitActor
) {
  const config = API_RATE_LIMIT_CONFIG[category];
  const now = Date.now();
  const ipAddress = getClientIp(request);
  const key = buildRateLimitKey(category, ipAddress, actor);
  const resource = buildRateLimitResource(category, key);
  const bucket = getBucket(resource, config.windowMs, now);
  const isLimited = bucket.count >= config.limit;

  if (!isLimited) {
    bucket.count += 1;
    cleanupExpiredBuckets(now);
    return null;
  }

  if (!bucket.limitedLoggedAt || bucket.limitedLoggedAt + config.windowMs <= now) {
    bucket.limitedLoggedAt = now;
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
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      category,
    }
  );
}
