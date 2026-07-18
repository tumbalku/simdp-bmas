import * as argon2 from "argon2";
import crypto from "crypto";
import { hashRefreshToken } from "@/lib/auth";
import { logActivity } from "@/modules/security/service";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/constants";
import * as repo from "../repositories/common";

export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await repo.findUserWithEmployeeByEmail(email);

  if (!user) {
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

  const resetToken = "prt_" + crypto.randomBytes(24).toString("hex");
  const hashedResetToken = hashRefreshToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

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
