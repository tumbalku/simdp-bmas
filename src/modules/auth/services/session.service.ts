import * as argon2 from "argon2";
import crypto from "crypto";
import { generateRefreshToken, hashRefreshToken } from "@/lib/auth";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repositories/common";

export interface LoginResult {
  user: {
    id: string;
    email: string;
    role: string;
    employeeId: string | null;
  };
  refreshTokenPlain: string;
}

export async function loginUser(
  identifier: string,
  password: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<LoginResult | null> {
  const isNumeric = (str: string) => /^\d+$/.test(str);
  let userId: string | null = null;

  if (isNumeric(identifier) && identifier.length === 16) {
    const employee = await repo.findEmployeeUserIdByNik(identifier);
    if (employee) userId = employee.userId;
  } else if (isNumeric(identifier) && identifier.length >= 10) {
    const employee = await repo.findEmployeeUserIdByEmployeeId(identifier);
    if (employee) userId = employee.userId;
  }

  if (!userId) {
    const user = await repo.findUserIdByEmail(identifier);
    if (user) userId = user.id;
  }

  if (!userId) {
    await logActivity({
      actorName: "System",
      actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
      eventType: SECURITY_EVENT_TYPE.AUTH_LOGIN_FAILED,
      resource: `UserIdentifier:${identifier}`,
      ipAddress,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "User tidak ditemukan" },
    });
    return null;
  }

  const user = await repo.findActiveUserWithEmployee(userId);

  if (!user) {
    await logActivity({
      actorName: "System",
      actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
      eventType: SECURITY_EVENT_TYPE.AUTH_LOGIN_FAILED,
      resource: `User:${userId}`,
      ipAddress,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "User tidak aktif atau terhapus" },
    });
    return null;
  }

  const isPasswordMatch = await argon2.verify(user.passwordHash, password);
  if (!isPasswordMatch) {
    await logActivity({
      actorId: user.id,
      actorName: user.employee?.name || user.email,
      actorRole: user.role,
      eventType: SECURITY_EVENT_TYPE.AUTH_LOGIN_FAILED,
      resource: `User:${user.id}`,
      ipAddress,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "Password salah" },
    });
    return null;
  }

  const employeeId = user.employee?.id || null;
  const activeTokens = await repo.findActiveRefreshTokensByUserId(user.id);

  if (activeTokens.length > 0) {
    await repo.revokeActiveRefreshTokensByUserId(user.id);
    await logActivity({
      actorId: user.id,
      actorName: user.employee?.name || user.email,
      actorRole: user.role,
      eventType: SECURITY_EVENT_TYPE.AUTH_FORCE_LOGOUT_OTHERS,
      resource: `User:${user.id}`,
      ipAddress,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { revokedCount: activeTokens.length },
    });
  }

  const refreshTokenPlain = generateRefreshToken();
  const hashedToken = hashRefreshToken(refreshTokenPlain);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await repo.createRefreshToken({
    id: crypto.randomUUID(),
    userId: user.id,
    token: hashedToken,
    expiresAt,
    userAgent,
    ipAddress,
  });

  await repo.updateUserLastLoginAt(user.id);

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: SECURITY_EVENT_TYPE.AUTH_LOGIN_SUCCESS,
    resource: `User:${user.id}`,
    ipAddress,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId,
    },
    refreshTokenPlain,
  };
}

export async function rotateSession(
  tokenPlain: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<LoginResult | null> {
  const hashedToken = hashRefreshToken(tokenPlain);
  const refreshTokenRecord = await repo.findRefreshTokenForRotationByToken(hashedToken);

  if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
    await logActivity({
      actorName: "System",
      actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
      eventType: SECURITY_EVENT_TYPE.AUTH_REFRESH_FAILED,
      resource: "SessionRotation",
      ipAddress,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "Token invalid, revoked, atau expired" },
    });
    return null;
  }

  const user = refreshTokenRecord.user;

  await repo.revokeRefreshTokenById(refreshTokenRecord.id);

  const newRefreshTokenPlain = generateRefreshToken();
  const newHashedToken = hashRefreshToken(newRefreshTokenPlain);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await repo.createRefreshToken({
    id: crypto.randomUUID(),
    userId: user.id,
    token: newHashedToken,
    expiresAt,
    userAgent,
    ipAddress,
  });

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: SECURITY_EVENT_TYPE.AUTH_REFRESH_SUCCESS,
    resource: `User:${user.id}`,
    ipAddress,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id || null,
    },
    refreshTokenPlain: newRefreshTokenPlain,
  };
}

export async function logoutUser(tokenPlain: string, userId: string, actorRole: string): Promise<boolean> {
  const hashedToken = hashRefreshToken(tokenPlain);
  const user = await repo.findUserWithEmployeeById(userId);
  const actorName = user?.employee?.name || user?.email || "User";
  const refreshTokenRecord = await repo.findRefreshTokenByTokenAndUserId(hashedToken, userId);

  if (refreshTokenRecord) {
    await repo.revokeRefreshTokenById(refreshTokenRecord.id);
  }

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_LOGOUT,
    resource: `User:${userId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return true;
}
