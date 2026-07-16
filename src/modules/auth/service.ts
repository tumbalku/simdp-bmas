import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";
import crypto from "crypto";
import { generateRefreshToken, hashRefreshToken } from "@/lib/auth";
import { logActivity } from "@/modules/security/service";

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
    const employee = await prisma.employee.findFirst({
      where: { nik: identifier, deletedAt: null },
      select: { userId: true },
    });
    if (employee) userId = employee.userId;
  } else if (isNumeric(identifier) && identifier.length >= 10) {
    const employee = await prisma.employee.findFirst({
      where: { employeeId: identifier, deletedAt: null },
      select: { userId: true },
    });
    if (employee) userId = employee.userId;
  }

  // Fallback to email if not resolved
  if (!userId) {
    const user = await prisma.user.findFirst({
      where: { email: identifier, deletedAt: null },
      select: { id: true },
    });
    if (user) userId = user.id;
  }

  if (!userId) {
    await logActivity({
      actorName: "System",
      actorRole: "Public",
      eventType: "AUTH_LOGIN_FAILED",
      resource: `UserIdentifier:${identifier}`,
      ipAddress,
      status: "FAILED",
      metadata: { reason: "User tidak ditemukan" },
    });
    return null;
  }

  // Fetch active user
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true, deletedAt: null },
    include: { employee: true },
  });

  if (!user) {
    await logActivity({
      actorName: "System",
      actorRole: "Public",
      eventType: "AUTH_LOGIN_FAILED",
      resource: `User:${userId}`,
      ipAddress,
      status: "FAILED",
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
      eventType: "AUTH_LOGIN_FAILED",
      resource: `User:${user.id}`,
      ipAddress,
      status: "FAILED",
      metadata: { reason: "Password salah" },
    });
    return null;
  }

  const employeeId = user.employee?.id || null;

  // Single device enforcement: revoke other active refresh tokens
  const activeTokens = await prisma.refreshToken.findMany({
    where: { userId: user.id, revokedAt: null },
  });

  if (activeTokens.length > 0) {
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await logActivity({
      actorId: user.id,
      actorName: user.employee?.name || user.email,
      actorRole: user.role,
      eventType: "AUTH_FORCE_LOGOUT_OTHERS",
      resource: `User:${user.id}`,
      ipAddress,
      status: "SUCCESS",
      metadata: { revokedCount: activeTokens.length },
    });
  }

  // Create new refresh token
  const refreshTokenPlain = generateRefreshToken();
  const hashedToken = hashRefreshToken(refreshTokenPlain);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      token: hashedToken,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: "AUTH_LOGIN_SUCCESS",
    resource: `User:${user.id}`,
    ipAddress,
    status: "SUCCESS",
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

  const refreshTokenRecord = await prisma.refreshToken.findFirst({
    where: { token: hashedToken, revokedAt: null },
    include: {
      user: {
        include: { employee: true },
      },
    },
  });

  if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
    await logActivity({
      actorName: "System",
      actorRole: "Public",
      eventType: "AUTH_REFRESH_FAILED",
      resource: "SessionRotation",
      ipAddress,
      status: "FAILED",
      metadata: { reason: "Token invalid, revoked, atau expired" },
    });
    return null;
  }

  const user = refreshTokenRecord.user;

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { revokedAt: new Date() },
  });

  // Generate new refresh token
  const newRefreshTokenPlain = generateRefreshToken();
  const newHashedToken = hashRefreshToken(newRefreshTokenPlain);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      token: newHashedToken,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: "AUTH_REFRESH_SUCCESS",
    resource: `User:${user.id}`,
    ipAddress,
    status: "SUCCESS",
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

  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: { employee: true },
  });
  const actorName = user?.employee?.name || user?.email || "User";

  const refreshTokenRecord = await prisma.refreshToken.findFirst({
    where: { token: hashedToken, userId },
  });

  if (refreshTokenRecord) {
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { revokedAt: new Date() },
    });
  }

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: "AUTH_LOGOUT",
    resource: `User:${userId}`,
    status: "SUCCESS",
  });

  return true;
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { employee: true },
  });

  if (!user) {
    // Generate a log for non-existent email safely
    await logActivity({
      actorName: "System",
      actorRole: "Public",
      eventType: "AUTH_PASSWORD_RESET_REQUESTED",
      resource: `Email:${email}`,
      status: "FAILED",
      metadata: { reason: "Email tidak terdaftar" },
    });
    return null;
  }

  // Create reset token
  const resetToken = "prt_" + crypto.randomBytes(24).toString("hex");
  const hashedResetToken = hashRefreshToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      token: hashedResetToken,
      expiresAt,
    },
  });

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: "AUTH_PASSWORD_RESET_REQUESTED",
    resource: `User:${user.id}`,
    status: "SUCCESS",
  });

  return resetToken;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const hashedResetToken = hashRefreshToken(token);
  const resetTokenRecord = await prisma.passwordResetToken.findFirst({
    where: { token: hashedResetToken, usedAt: null },
    include: {
      user: {
        include: { employee: true },
      },
    },
  });

  if (!resetTokenRecord || resetTokenRecord.expiresAt < new Date()) {
    return false;
  }

  const user = resetTokenRecord.user;
  const passwordHash = await argon2.hash(newPassword);

  // Update user password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all refresh tokens
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await logActivity({
    actorId: user.id,
    actorName: user.employee?.name || user.email,
    actorRole: user.role,
    eventType: "AUTH_PASSWORD_RESET_SUCCESS",
    resource: `User:${user.id}`,
    status: "SUCCESS",
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
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) return false;

  const isPasswordMatch = await argon2.verify(user.passwordHash, oldPassword);
  if (!isPasswordMatch) return false;

  const isSamePassword = await argon2.verify(user.passwordHash, newPassword);
  if (isSamePassword) return false;

  const passwordHash = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: "AUTH_PASSWORD_CHANGED",
    resource: `User:${userId}`,
    status: "SUCCESS",
  });

  return true;
}

export async function getCurrentUserAccount(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      employee: {
        select: {
          name: true,
          employeeId: true,
          nik: true,
        },
      },
    },
  });

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
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: { id: tokenId, userId },
  });

  if (!tokenRecord) return false;

  await prisma.refreshToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: "AUTH_REFRESH_FAILED", // Used as revoke audit per auth.md
    resource: `RefreshToken:${tokenId}`,
    status: "SUCCESS",
    metadata: { action: "revoke_session" },
  });

  return true;
}

export async function revokeAllSessions(userId: string, actorName: string, actorRole: string): Promise<boolean> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: "AUTH_FORCE_LOGOUT_OTHERS",
    resource: `User:${userId}`,
    status: "SUCCESS",
    metadata: { action: "revoke_all_sessions" },
  });

  return true;
}
