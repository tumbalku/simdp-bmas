import { prisma } from "@/lib/prisma";

export function findEmployeeUserIdByNik(nik: string) {
  return prisma.employee.findFirst({
    where: { nik, deletedAt: null },
    select: { userId: true },
  });
}

export function findEmployeeUserIdByEmployeeId(employeeId: string) {
  return prisma.employee.findFirst({
    where: { employeeId, deletedAt: null },
    select: { userId: true },
  });
}

export function findUserIdByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });
}

export function findActiveUserWithEmployee(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, isActive: true, deletedAt: null },
    include: { employee: true },
  });
}

export function findUserWithEmployeeById(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId },
    include: { employee: true },
  });
}

export function findUserWithEmployeeByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { employee: true },
  });
}

export function findActiveRefreshTokensByUserId(userId: string) {
  return prisma.refreshToken.findMany({
    where: { userId, revokedAt: null },
  });
}

export function findActiveRefreshTokenSessionsByUserId(userId: string) {
  return prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export function revokeActiveRefreshTokensByUserId(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function createRefreshToken(input: {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  return prisma.refreshToken.create({
    data: input,
  });
}

export function updateUserLastLoginAt(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export function findRefreshTokenForRotationByToken(token: string) {
  return prisma.refreshToken.findFirst({
    where: { token, revokedAt: null },
    include: {
      user: {
        include: { employee: true },
      },
    },
  });
}

export function findRefreshTokenByTokenAndUserId(token: string, userId: string) {
  return prisma.refreshToken.findFirst({
    where: { token, userId },
  });
}

export function findRefreshTokenByIdAndUserId(id: string, userId: string) {
  return prisma.refreshToken.findFirst({
    where: { id, userId },
  });
}

export function revokeRefreshTokenById(id: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export function createPasswordResetToken(input: {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}) {
  return prisma.passwordResetToken.create({
    data: input,
  });
}

export function markPasswordResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export function findUnusedPasswordResetTokenWithUser(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: { token, usedAt: null },
    include: {
      user: {
        include: { employee: true },
      },
    },
  });
}

export function resetUserPasswordAndRevokeSessions(input: {
  userId: string;
  resetTokenId: string;
  passwordHash: string;
}) {
  return prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { passwordHash: input.passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: input.resetTokenId },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: input.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export function findUserById(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
}

export function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export function findCurrentUserAccount(userId: string) {
  return prisma.user.findFirst({
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
}
