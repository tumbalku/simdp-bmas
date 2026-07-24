import crypto from "crypto";

import {
  claimSharedRateLimitLimitedLog,
  getSharedRateLimitBucket,
  incrementSharedRateLimitBucket,
} from "@/lib/rate-limit-store";
import { logActivity } from "@/modules/security/server";
import {
  SECURITY_ACTOR_ROLE,
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
} from "@/modules/security/server";

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_CATEGORY = "AUTH_LOGIN_FAILED";

export function normalizeLoginIpAddress(ipAddress?: string | null) {
  const fallback = "unknown";
  if (!ipAddress) return fallback;

  return ipAddress.split(",")[0]?.trim() || fallback;
}

function buildLoginRateLimitResource(normalizedIpAddress: string) {
  return crypto.createHash("sha256").update(`${LOGIN_RATE_LIMIT_CATEGORY}:${normalizedIpAddress}`).digest("hex").slice(0, 24);
}

export async function isLoginRateLimited(ipAddress?: string | null) {
  const key = normalizeLoginIpAddress(ipAddress);
  const bucket = await getSharedRateLimitBucket(buildLoginRateLimitResource(key));
  return bucket ? bucket.count >= LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS : false;
}

export async function logRateLimitedLoginAttempt(ipAddress?: string | null) {
  const normalizedIpAddress = normalizeLoginIpAddress(ipAddress);
  const resource = buildLoginRateLimitResource(normalizedIpAddress);
  const bucket = await getSharedRateLimitBucket(resource);
  if (!bucket) return;

  if (await claimSharedRateLimitLimitedLog(resource)) {
    await logActivity({
      actorName: "System",
      actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
      eventType: SECURITY_EVENT_TYPE.AUTH_LOGIN_FAILED,
      resource: `LoginRateLimit:${normalizedIpAddress}`,
      ipAddress: normalizedIpAddress,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "RATE_LIMITED" },
    });
  }
}

export function registerFailedLoginAttempt(ipAddress?: string | null) {
  const key = normalizeLoginIpAddress(ipAddress);
  return incrementSharedRateLimitBucket({
    key: buildLoginRateLimitResource(key),
    category: LOGIN_RATE_LIMIT_CATEGORY,
    windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
  });
}

