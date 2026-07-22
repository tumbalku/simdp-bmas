import crypto from "crypto";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

import { env } from "@/lib/env";
import { emailProvider, isEmailProviderConfigured } from "@/lib/notifications";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repositories/common";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const RECOVERY_CODE_COUNT = 8;
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_LOCK_MS = 10 * 60 * 1000;
const EMAIL_OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function encryptionKey() {
  return crypto.createHash("sha256").update(env.REFRESH_TOKEN_SECRET).digest();
}

function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((value) => value.toString("base64url")).join(".");
}

function decryptSecret(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Invalid 2FA secret");
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function hashRecoveryCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function hashEmailCode(userId: string, code: string) {
  return crypto.createHash("sha256").update(`${env.REFRESH_TOKEN_SECRET}:${userId}:${code}`).digest("hex");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

export async function isTwoFactorEnabled(userId: string) {
  const record = await repo.findUserTwoFactor(userId);
  return record?.enabled === true;
}

export async function beginTwoFactorSetup(userId: string, email: string) {
  const existing = await repo.findUserTwoFactor(userId);
  if (existing?.enabled) return null;

  const secret = generateSecret();
  const uri = generateURI({ issuer: "SiCantIK", label: email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 240 });

  await repo.upsertUserTwoFactor({
    userId,
    secretEncrypted: encryptSecret(secret),
    recoveryCodeHashes: [],
    enabled: false,
  });

  return { secret, qrCodeDataUrl };
}

export async function confirmTwoFactorSetup(userId: string, token: string, actorName: string, actorRole: string) {
  const record = await repo.findUserTwoFactor(userId);
  if (!record || record.enabled) return null;

  const valid = (await verify({ secret: decryptSecret(record.secretEncrypted), token })).valid;
  if (!valid) return null;

  const recoveryCodes = generateRecoveryCodes();
  await repo.updateUserTwoFactor(userId, {
    enabled: true,
    recoveryCodeHashes: recoveryCodes.map(hashRecoveryCode),
  });
  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_2FA_ENABLED,
    resource: `User:${userId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return { recoveryCodes };
}

export async function verifyTwoFactorToken(userId: string, token: string) {
  const record = await repo.findUserTwoFactor(userId);
  if (!record?.enabled) return false;

  const normalizedToken = token.replace(/\s/g, "").toUpperCase();
  const secret = decryptSecret(record.secretEncrypted);
  if ((await verify({ secret, token: normalizedToken })).valid) return true;

  const recoveryCodeHash = hashRecoveryCode(normalizedToken);
  if (Array.isArray(record.recoveryCodeHashes) && record.recoveryCodeHashes.includes(recoveryCodeHash)) {
    await repo.updateUserTwoFactor(userId, {
      recoveryCodeHashes: record.recoveryCodeHashes.filter((value): value is string => value !== recoveryCodeHash),
    });
    return true;
  }

  const now = new Date();
  if (!record.emailOtpHash || !record.emailOtpExpiresAt || record.emailOtpExpiresAt <= now) return false;
  if (record.emailOtpLockedUntil && record.emailOtpLockedUntil > now) return false;

  if (hashEmailCode(userId, normalizedToken) !== record.emailOtpHash) {
    const attempts = record.emailOtpAttempts + 1;
    await repo.updateUserTwoFactor(userId, {
      emailOtpAttempts: attempts,
      emailOtpLockedUntil: attempts >= EMAIL_OTP_MAX_ATTEMPTS ? new Date(now.getTime() + EMAIL_OTP_LOCK_MS) : null,
    });
    return false;
  }

  await repo.updateUserTwoFactor(userId, {
    emailOtpHash: null,
    emailOtpExpiresAt: null,
    emailOtpSentAt: null,
    emailOtpAttempts: 0,
    emailOtpLockedUntil: null,
  });
  return true;
}

export async function sendTwoFactorEmailCode(userId: string, email: string) {
  const record = await repo.findUserTwoFactor(userId);
  if (!record?.enabled) return { sent: false as const, reason: "NOT_ENABLED" as const };
  if (!isEmailProviderConfigured()) return { sent: false as const, reason: "EMAIL_NOT_CONFIGURED" as const };

  const now = Date.now();
  if (record.emailOtpSentAt && now - record.emailOtpSentAt.getTime() < EMAIL_OTP_RESEND_COOLDOWN_MS) {
    return { sent: false as const, reason: "COOLDOWN" as const, retryAfterSeconds: Math.ceil((EMAIL_OTP_RESEND_COOLDOWN_MS - (now - record.emailOtpSentAt.getTime())) / 1000) };
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(now + EMAIL_OTP_TTL_MS);
  await repo.updateUserTwoFactor(userId, {
    emailOtpHash: hashEmailCode(userId, code),
    emailOtpExpiresAt: expiresAt,
    emailOtpSentAt: new Date(now),
    emailOtpAttempts: 0,
    emailOtpLockedUntil: null,
  });

  try {
    await emailProvider.sendEmail({
      to: email,
      subject: "Kode verifikasi login SiCantIK",
      text: `Kode verifikasi login Anda adalah ${code}. Kode berlaku selama 10 menit dan hanya dapat digunakan satu kali. Jika Anda tidak meminta kode ini, segera hubungi administrator.`,
      html: `<p>Kode verifikasi login Anda:</p><p style="font-size:24px;font-weight:700;letter-spacing:6px">${code}</p><p>Kode berlaku selama 10 menit dan hanya dapat digunakan satu kali.</p><p>Jika Anda tidak meminta kode ini, segera hubungi administrator.</p>`,
    });
  } catch (error) {
    await repo.updateUserTwoFactor(userId, { emailOtpHash: null, emailOtpExpiresAt: null, emailOtpSentAt: null, emailOtpAttempts: 0, emailOtpLockedUntil: null });
    throw error;
  }

  return { sent: true as const, maskedEmail: maskEmail(email), expiresInSeconds: EMAIL_OTP_TTL_MS / 1000 };
}

export async function disableTwoFactor(userId: string, actorName: string, actorRole: string) {
  await repo.updateUserTwoFactor(userId, { enabled: false, recoveryCodeHashes: [] });
  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_2FA_DISABLED,
    resource: `User:${userId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });
}
