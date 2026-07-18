import * as argon2 from "argon2";
import crypto from "crypto";
import { generateRefreshToken, hashRefreshToken } from "@/lib/auth";
import { logActivity } from "@/modules/security/service";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/constants";
import * as repo from "./repositories/common";

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

  // 1. Identify detection logic
  if (isNumeric(identifier) && identifier.length === 16) {
    const employee = await repo.findEmployeeUserIdByNik(identifier);
    if (employee) userId = employee.userId;
  } else if (isNumeric(identifier) && identifier.length >= 10) {
    const employee = await repo.findEmployeeUserIdByEmployeeId(identifier);
    if (employee) userId = employee.userId;
  }

  // Fallback to email if not resolved
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

  // Fetch active user
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

  // Verify password
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

  // Single device enforcement: revoke other active refresh tokens
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

  // Create new refresh token
  const refreshTokenPlain = generateRefreshToken();
  const hashedToken = hashRefreshToken(refreshTokenPlain);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await repo.createRefreshToken({
    id: crypto.randomUUID(),
    userId: user.id,
    token: hashedToken,
    expiresAt,
    userAgent,
    ipAddress,
  });

  // Update last login timestamp
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

  // Revoke old token
  await repo.revokeRefreshTokenById(refreshTokenRecord.id);

  // Generate new refresh token
  const newRefreshTokenPlain = generateRefreshToken();
  const newHashedToken = hashRefreshToken(newRefreshTokenPlain);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await repo.findUserWithEmployeeByEmail(email);

  if (!user) {
    // Generate a log for non-existent email safely
    await logActivity({
      actorName: "System",
      actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
      eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_REQUESTED,
      resource: `Email:${email}`,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "Email tidak terdaftar" },
    });
    return null;
  }

  // Create reset token
  const resetToken = "prt_" + crypto.randomBytes(24).toString("hex");
  const hashedResetToken = hashRefreshToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await repo.createPasswordResetToken({
    id: crypto.randomUUID(),
    userId: user.id,
    token: hashedResetToken,
    expiresAt,
  });

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_REQUESTED,
    resource: `User:${user.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return resetToken;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const hashedResetToken = hashRefreshToken(token);
  const resetTokenRecord = await repo.findUnusedPasswordResetTokenWithUser(hashedResetToken);

  if (!resetTokenRecord || resetTokenRecord.expiresAt < new Date()) {
    return false;
  }

  const user = resetTokenRecord.user;
  const passwordHash = await argon2.hash(newPassword);

  // Update user password and mark token as used
  await repo.resetUserPasswordAndRevokeSessions({
    userId: user.id,
    resetTokenId: resetTokenRecord.id,
    passwordHash,
  });

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_SUCCESS,
    resource: `User:${user.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return true;
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
  actorName: string,
  actorRole: string
): Promise<boolean> {
  const user = await repo.findUserById(userId);

  if (!user) return false;

  const isPasswordMatch = await argon2.verify(user.passwordHash, oldPassword);
  if (!isPasswordMatch) return false;

  const isSamePassword = await argon2.verify(user.passwordHash, newPassword);
  if (isSamePassword) return false;

  const passwordHash = await argon2.hash(newPassword);

  await repo.updateUserPassword(userId, passwordHash);

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_CHANGED,
    resource: `User:${userId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return true;
}

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

export async function revokeSession(userId: string, tokenId: string, actorName: string, actorRole: string): Promise<boolean> {
  const tokenRecord = await repo.findRefreshTokenByIdAndUserId(tokenId, userId);

  if (!tokenRecord) return false;

  await repo.revokeRefreshTokenById(tokenId);

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_REFRESH_FAILED, // Used as revoke audit per auth.md
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
