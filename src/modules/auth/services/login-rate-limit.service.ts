import { logActivity } from "@/modules/security/server";
import {
  SECURITY_ACTOR_ROLE,
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
} from "@/modules/security/server";

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS = 5;

// Memory storage for failed login attempts to prevent DB hot-write amplification.
type FailedLoginBucket = {
  count: number;
  resetAt: number;
  limitedLoggedAt?: number;
};

const failedLoginBuckets = new Map<string, FailedLoginBucket>();

export function normalizeLoginIpAddress(ipAddress?: string | null) {
  const fallback = "unknown";
  if (!ipAddress) return fallback;

  return ipAddress.split(",")[0]?.trim() || fallback;
}

export async function isLoginRateLimited(ipAddress?: string | null) {
  const key = normalizeLoginIpAddress(ipAddress);
  const now = Date.now();
  const bucket = failedLoginBuckets.get(key);

  if (bucket && bucket.resetAt > now) {
    return bucket.count >= LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS;
  }

  return false;
}

export async function logRateLimitedLoginAttempt(ipAddress?: string | null) {
  const normalizedIpAddress = normalizeLoginIpAddress(ipAddress);
  const now = Date.now();
  const bucket = failedLoginBuckets.get(normalizedIpAddress);

  if (bucket) {
    if (!bucket.limitedLoggedAt || bucket.limitedLoggedAt + LOGIN_RATE_LIMIT_WINDOW_MS <= now) {
      bucket.limitedLoggedAt = now;
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
}

export function registerFailedLoginAttempt(ipAddress?: string | null) {
  const key = normalizeLoginIpAddress(ipAddress);
  const now = Date.now();
  let bucket = failedLoginBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS };
    failedLoginBuckets.set(key, bucket);
  }

  bucket.count += 1;

  // Cleanup map if it gets too large
  if (failedLoginBuckets.size > 2000) {
    for (const [k, b] of failedLoginBuckets.entries()) {
      if (b.resetAt <= now) {
        failedLoginBuckets.delete(k);
      }
    }
  }
}

