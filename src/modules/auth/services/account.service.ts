import { logActivity } from "@/modules/security/service";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/constants";
import * as repo from "../repositories/common";

export async function getCurrentUserAccount(userId: string) {
  const user = await repo.findCurrentUserAccount(userId);

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    employeeName: user.employee?.name ?? null,
    employeeId: user.employee?.employeeId ?? null,
    nik: user.employee?.nik ?? null,
  };
}

export async function revokeSession(
  userId: string,
  tokenId: string,
  actorName: string,
  actorRole: string
): Promise<boolean> {
  const tokenRecord = await repo.findRefreshTokenByIdAndUserId(tokenId, userId);

  if (!tokenRecord) return false;

  await repo.revokeRefreshTokenById(tokenId);

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_REFRESH_FAILED,
    resource: `RefreshToken:${tokenId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { action: "revoke_session" },
  });

  return true;
}

export async function revokeAllSessions(userId: string, actorName: string, actorRole: string): Promise<boolean> {
  await repo.revokeActiveRefreshTokensByUserId(userId);

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_FORCE_LOGOUT_OTHERS,
    resource: `User:${userId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { action: "revoke_all_sessions" },
  });

  return true;
}
