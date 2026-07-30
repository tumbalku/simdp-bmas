import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import { getProfileAvatarDisplayUrl } from "@/modules/employee/server";
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
    twoFactorEnabled: user.twoFactor?.enabled ?? false,
  };
}

export async function getSessionProfile(userId: string) {
  const user = await repo.findUserWithEmployeeById(userId);

  if (!user) return null;

  return {
    userId: user.id,
    name: user.employee?.name || "User",
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    avatarUrl: getProfileAvatarDisplayUrl(user.employee?.avatarUrl) || user.employee?.googleAvatarUrl || null,
    employeeId: user.employee?.employeeId || null,
  };
}

export async function getActiveSessions(userId: string) {
  const sessions = await repo.findActiveRefreshTokenSessionsByUserId(userId);

  return sessions.map((session) => ({
    id: session.id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }));
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
    eventType: SECURITY_EVENT_TYPE.AUTH_SESSION_REVOKED,
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
