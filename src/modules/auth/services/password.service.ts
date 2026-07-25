import * as argon2 from "argon2";
import crypto from "crypto";
import { hashRefreshToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { emailProvider } from "@/lib/notifications";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repositories/common";

function buildResetPasswordUrl(resetToken: string) {
  const url = new URL("/reset-password", env.NEXT_PUBLIC_APP_URL);
  url.searchParams.set("token", resetToken);
  return url.toString();
}

function buildEmailHashResource(email: string) {
  const digest = crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 24);

  return `EmailHash:${digest}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildResetPasswordEmail(input: {
  resetUrl: string;
  displayName: string;
  expiresIn: string;
}) {
  const safeDisplayName = escapeHtml(input.displayName);
  const safeResetUrl = escapeHtml(input.resetUrl);

  const text = [
    `Halo ${input.displayName},`,
    "",
    "Kami menerima permintaan reset password untuk akun SIMDP Anda.",
    `Klik link berikut untuk membuat password baru: ${input.resetUrl}`,
    "",
    `Link ini berlaku ${input.expiresIn}. Jika Anda tidak meminta reset password, abaikan email ini.`,
    "",
    "Salam,",
    "SIMDP RSUD Bahteramas",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Halo ${safeDisplayName},</p>
      <p>Kami menerima permintaan reset password untuk akun SIMDP Anda.</p>
      <p>
        <a href="${safeResetUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;">
          Reset password
        </a>
      </p>
      <p>Atau salin link berikut ke browser Anda:</p>
      <p><a href="${safeResetUrl}">${safeResetUrl}</a></p>
      <p>Link ini berlaku ${input.expiresIn}. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      <p>Salam,<br />SIMDP RSUD Bahteramas</p>
    </div>
  `;

  return { html, text };
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  const user = await repo.findUserWithEmployeeByEmail(email);

  if (!user) {
    await logActivity({
      actorName: "System",
      actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
      eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_REQUESTED,
      resource: buildEmailHashResource(email),
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "Email tidak terdaftar" },
    });
    return false;
  }

  const resetToken = "prt_" + crypto.randomBytes(24).toString("hex");
  const hashedResetToken = hashRefreshToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const resetTokenId = crypto.randomUUID();

  await repo.createPasswordResetToken({
    id: resetTokenId,
    userId: user.id,
    token: hashedResetToken,
    expiresAt,
  });

  const displayName = user.employee?.name || user.email;
  const resetUrl = buildResetPasswordUrl(resetToken);
  const resetEmail = buildResetPasswordEmail({
    resetUrl,
    displayName,
    expiresIn: "1 jam",
  });

  try {
    await emailProvider.sendEmail({
      to: user.email,
      subject: "Reset password akun SIMDP",
      html: resetEmail.html,
      text: resetEmail.text,
    });
  } catch {
    await repo.markPasswordResetTokenUsed(resetTokenId);
    await logActivity({
      actorId: user.id,
      actorName: displayName,
      actorRole: user.role,
      eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_REQUESTED,
      resource: `User:${user.id}`,
      status: SECURITY_LOG_STATUS.FAILED,
      metadata: { reason: "EMAIL_DELIVERY_FAILED" },
    });

    return false;
  }

  await logActivity({
    actorId: user.id,
    actorName: displayName,
    actorRole: user.role,
    eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_REQUESTED,
    resource: `User:${user.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return true;
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


export async function verifyCurrentPassword(userId: string, password: string): Promise<boolean> {
  const user = await repo.findUserById(userId);

  if (!user) return false;

  return argon2.verify(user.passwordHash, password);
}
