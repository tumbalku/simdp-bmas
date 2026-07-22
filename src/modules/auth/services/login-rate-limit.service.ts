import { logActivity } from "@/modules/security/server";
import {
  SECURITY_ACTOR_ROLE,
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
  countRecentFailedLoginAttemptsByIp,
} from "@/modules/security/server";

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS = 5;

export function normalizeLoginIpAddress(ipAddress?: string | null) {
  const fallback = "unknown";
  if (!ipAddress) return fallback;

  return ipAddress.split(",")[0]?.trim() || fallback;
}

export async function isLoginRateLimited(ipAddress?: string | null) {
  const key = normalizeLoginIpAddress(ipAddress);
  const failedAttemptCount = await countRecentFailedLoginAttemptsByIp(
    key,
    new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MS)
  );

  return failedAttemptCount >= LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS;
}

export async function logRateLimitedLoginAttempt(ipAddress?: string | null) {
  const normalizedIpAddress = normalizeLoginIpAddress(ipAddress);

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
