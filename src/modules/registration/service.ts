import * as argon2 from "argon2";
import crypto from "crypto";
import type { Prisma, UserRegistrationRequest } from "@prisma/client";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { emailProvider, isEmailProviderConfigured } from "@/lib/notifications";
import { createNotification } from "@/modules/notification/server";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import { REGISTRATION_OTP_MAX_ATTEMPTS, REGISTRATION_OTP_TTL_MINUTES, REGISTRATION_STATUS, REGISTRATION_STATUS_LABELS, type RegistrationStatus } from "./constants";
import { listRegistrationRequestsSchema, submitRegistrationSchema, verifyRegistrationOtpSchema, type ListRegistrationRequestsInput, type SubmitRegistrationInput, type VerifyRegistrationOtpInput } from "./schema";
import * as repo from "./repository";
import { sendRegistrationApprovalEmail } from "./approval-email";

export type RegistrationRequestListItem = {
  id: string;
  email: string;
  name: string;
  nik: string | null;
  claimedNip: string | null;
  phone: string | null;
  workplaceName: string | null;
  status: RegistrationStatus;
  statusLabel: string;
  emailVerifiedAt: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewNote: string | null;
  createdAt: string;
};

export type RegistrationRequestListResult = {
  data: RegistrationRequestListItem[];
  pendingCount: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function assertRegistrationEnabled() {
  if (!env.PUBLIC_REGISTRATION_ENABLED) {
    throw new AppError("REGISTRATION_DISABLED", "Registrasi mandiri belum dibuka oleh administrator.", 403);
  }
}

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashOtp(email: string, otp: string) {
  return crypto
    .createHmac("sha256", env.JWT_SECRET)
    .update(`registration-otp:${email.toLowerCase()}:${otp}`)
    .digest("hex");
}

function isMatchingOtp(input: { email: string; otp: string; expectedHash: string }) {
  const actual = Buffer.from(hashOtp(input.email, input.otp), "hex");
  const expected = Buffer.from(input.expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

function mapStatus(value: string): RegistrationStatus {
  return value in REGISTRATION_STATUS ? (value as RegistrationStatus) : REGISTRATION_STATUS.EMAIL_PENDING;
}

function isStaleRegistrationTransition(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message === "REGISTRATION_NOT_REVIEWABLE" || message === "REGISTRATION_NOT_VERIFYABLE";
}

function toListItem(item: UserRegistrationRequest): RegistrationRequestListItem {
  const status = mapStatus(item.status);
  return {
    id: item.id,
    email: item.email,
    name: item.name,
    nik: item.nik,
    claimedNip: item.claimedNip,
    phone: item.phone,
    workplaceName: item.workplaceName,
    status,
    statusLabel: REGISTRATION_STATUS_LABELS[status],
    emailVerifiedAt: item.emailVerifiedAt?.toISOString() ?? null,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    reviewedByAdminId: item.reviewedByAdminId,
    reviewNote: item.reviewNote,
    createdAt: item.createdAt.toISOString(),
  };
}

async function assertNoExistingAccount(input: { email: string; nik?: string | null; claimedNip?: string | null; now: Date }) {
  const existingUser = await repo.findExistingUserByEmail(input.email);
  if (existingUser?.deletedAt) {
    throw new AppError("CONFLICT", "Email masih terhubung dengan akun yang diarsipkan. Hubungi admin untuk memulihkan atau menghapus permanen akun lama.", 409);
  }
  if (existingUser) {
    throw new AppError("CONFLICT", "Email sudah terdaftar. Silakan login atau hubungi admin.", 409);
  }

  const existingEmployee = await repo.findExistingEmployeeIdentity(input);
  if (
    existingEmployee?.deletedAt &&
    ((input.nik && existingEmployee.nik === input.nik) ||
      (input.claimedNip && existingEmployee.employeeId === input.claimedNip))
  ) {
    throw new AppError("CONFLICT", "Identitas masih terhubung dengan pegawai yang diarsipkan. Hubungi admin untuk memulihkan atau menghapus permanen data lama.", 409);
  }
  if (input.nik && existingEmployee?.nik === input.nik) {
    throw new AppError("CONFLICT", "NIK sudah terdaftar. Silakan hubungi admin.", 409);
  }
  if (input.claimedNip && existingEmployee?.employeeId === input.claimedNip) {
    throw new AppError("CONFLICT", "NIP sudah terdaftar. Silakan hubungi admin.", 409);
  }

  const existingRegistration = await repo.findRegistrationByIdentity(input);
  if (input.nik && existingRegistration?.nik === input.nik) {
    throw new AppError("CONFLICT", "NIK sedang dipakai pada registrasi lain yang belum selesai.", 409);
  }
  if (input.claimedNip && existingRegistration?.claimedNip === input.claimedNip) {
    throw new AppError("CONFLICT", "NIP sedang dipakai pada registrasi lain yang belum selesai.", 409);
  }
}

async function sendRegistrationOtpEmail(input: { email: string; otp: string }) {
  if (!isEmailProviderConfigured()) {
    throw new AppError("EMAIL_NOT_CONFIGURED", "Pengiriman email belum dikonfigurasi. Hubungi administrator.", 503);
  }

  await emailProvider.sendEmail({
    to: input.email,
    subject: "Kode verifikasi registrasi SiCantIK",
    text: `Kode verifikasi registrasi SiCantIK Anda adalah ${input.otp}. Kode berlaku ${REGISTRATION_OTP_TTL_MINUTES} menit.`,
    html: `<p>Kode verifikasi registrasi SiCantIK Anda:</p><p style="font-size:24px;font-weight:700;letter-spacing:6px">${input.otp}</p><p>Kode berlaku ${REGISTRATION_OTP_TTL_MINUTES} menit.</p><p>Jika Anda tidak mendaftar, abaikan email ini.</p>`,
  });
}

async function notifyAdminsForRegistration(request: UserRegistrationRequest) {
  try {
    const admins = await repo.findActiveAdmins();
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "INFO",
          title: "Registrasi user baru menunggu persetujuan",
          message: `${request.name} (${request.email}) sudah verifikasi email dan menunggu approve admin.`,
          skipDispatch: false,
        }),
      ),
    );
  } catch (error) {
    console.error("notifyAdminsForRegistration error:", error);
  }
}

async function deactivateExpiredRegistration(request: UserRegistrationRequest) {
  await repo.updateRegistration(request.id, {
    status: REGISTRATION_STATUS.EMAIL_PENDING,
    passwordHash: null,
    emailOtpHash: null,
    emailOtpExpiresAt: request.emailOtpExpiresAt,
  });
}

export async function submitRegistration(rawInput: SubmitRegistrationInput) {
  assertRegistrationEnabled();
  const parsed = submitRegistrationSchema.parse(rawInput);
  const { confirmPassword, ...registrationData } = parsed;
  void confirmPassword;
  const now = new Date();
  await repo.expireStaleEmailPendingRegistrations({ ...registrationData, now });
  await assertNoExistingAccount({ ...registrationData, now });

  const activeRegistration = await repo.findActiveRegistrationByEmail(registrationData.email, now);
  if (activeRegistration?.status === REGISTRATION_STATUS.UNDER_REVIEW) {
    throw new AppError("CONFLICT", "Registrasi email ini sudah menunggu persetujuan admin.", 409);
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(now.getTime() + REGISTRATION_OTP_TTL_MINUTES * 60 * 1000);
  const passwordHash = await argon2.hash(registrationData.password);

  const registrationInput = {
    id: crypto.randomUUID(),
    email: registrationData.email,
    name: registrationData.name,
    nik: registrationData.nik || null,
    claimedNip: registrationData.claimedNip || null,
    passwordHash,
    phone: registrationData.phone || null,
    otpHash: hashOtp(registrationData.email, otp),
    otpExpiresAt,
    now,
  };
  const latestRegistration = activeRegistration ?? await repo.findLatestRegistrationByEmail(registrationData.email);
  const request = latestRegistration?.status === REGISTRATION_STATUS.EMAIL_PENDING
    ? await repo.restartEmailPendingRegistration(latestRegistration.id, registrationInput)
    : await repo.createRegistration(registrationInput);

  await sendRegistrationOtpEmail({ email: registrationData.email, otp });

  await logActivity({
    actorName: registrationData.name,
    actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
    eventType: SECURITY_EVENT_TYPE.USER_REGISTRATION_SUBMITTED,
    resource: `UserRegistrationRequest:${request.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { email: registrationData.email, hasNik: Boolean(registrationData.nik), hasClaimedNip: Boolean(registrationData.claimedNip) },
  });

  return { id: request.id, maskedEmail: maskEmail(registrationData.email), expiresInSeconds: REGISTRATION_OTP_TTL_MINUTES * 60 };
}

export async function verifyRegistrationOtp(rawInput: VerifyRegistrationOtpInput) {
  assertRegistrationEnabled();
  const parsed = verifyRegistrationOtpSchema.parse(rawInput);
  const now = new Date();
  const request = await repo.findRegistrationByEmail(parsed.email, now);

  if (!request) {
    const latestRequest = await repo.findLatestRegistrationByEmail(parsed.email);
    if (
      latestRequest?.status === REGISTRATION_STATUS.EMAIL_PENDING &&
      latestRequest.emailOtpExpiresAt &&
      latestRequest.emailOtpExpiresAt <= now
    ) {
      await deactivateExpiredRegistration(latestRequest);
      throw new AppError("OTP_EXPIRED", "Kode OTP sudah kedaluwarsa. Silakan daftar ulang.", 400);
    }
    throw new AppError("NOT_FOUND", "Registrasi tidak ditemukan atau sudah diproses.", 404);
  }

  if (request.status !== REGISTRATION_STATUS.EMAIL_PENDING) {
    throw new AppError("NOT_FOUND", "Registrasi tidak ditemukan atau sudah diproses.", 404);
  }

  if (!request.emailOtpHash || !request.emailOtpExpiresAt || request.emailOtpExpiresAt <= now) {
    await deactivateExpiredRegistration(request);
    throw new AppError("OTP_EXPIRED", "Kode OTP sudah kedaluwarsa. Silakan daftar ulang.", 400);
  }

  if (request.emailOtpAttempts >= REGISTRATION_OTP_MAX_ATTEMPTS) {
    throw new AppError("OTP_LOCKED", "Terlalu banyak percobaan OTP. Silakan daftar ulang.", 429);
  }

  if (!isMatchingOtp({ email: parsed.email, otp: parsed.otp, expectedHash: request.emailOtpHash })) {
    await repo.updateRegistration(request.id, { emailOtpAttempts: { increment: 1 } });
    throw new AppError("OTP_INVALID", "Kode OTP tidak sesuai.", 400);
  }

  let verified: UserRegistrationRequest;
  try {
    verified = await repo.markRegistrationEmailVerified({ id: request.id, now });
  } catch (error) {
    if (!isStaleRegistrationTransition(error)) throw error;
    throw new AppError("BUSINESS_RULE_VIOLATION", "Registrasi ini sudah berubah. Silakan daftar ulang bila masih diperlukan.", 400);
  }

  await logActivity({
    actorName: request.name,
    actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
    eventType: SECURITY_EVENT_TYPE.USER_REGISTRATION_EMAIL_VERIFIED,
    resource: `UserRegistrationRequest:${request.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { email: request.email },
  });

  await notifyAdminsForRegistration(verified);

  return { id: verified.id, status: REGISTRATION_STATUS.UNDER_REVIEW };
}

export async function listRegistrationRequests(rawInput?: Partial<ListRegistrationRequestsInput>): Promise<RegistrationRequestListResult> {
  const parsed = listRegistrationRequestsSchema.parse(rawInput ?? {});
  const where: Prisma.UserRegistrationRequestWhereInput = {
    status: REGISTRATION_STATUS.UNDER_REVIEW,
  };

  if (parsed.search) {
    where.OR = [
      { email: { contains: parsed.search, mode: "insensitive" } },
      { name: { contains: parsed.search, mode: "insensitive" } },
      { nik: { contains: parsed.search, mode: "insensitive" } },
      { claimedNip: { contains: parsed.search, mode: "insensitive" } },
    ];
  }

  const [items, total, pendingCount] = await repo.listRegistrationRequests({
    where,
    skip: (parsed.page - 1) * parsed.limit,
    take: parsed.limit,
  });

  return {
    data: items.map(toListItem),
    pendingCount,
    pagination: {
      page: parsed.page,
      pageSize: parsed.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsed.limit)),
    },
  };
}

export async function approveRegistrationRequest(input: { id: string; actor: { userId: string; name: string; role: string } }) {
  const request = await repo.findRegistrationById(input.id);
  if (!request) throw new AppError("NOT_FOUND", "Registrasi tidak ditemukan.", 404);
  if (request.status !== REGISTRATION_STATUS.UNDER_REVIEW) {
    throw new AppError("BUSINESS_RULE_VIOLATION", "Registrasi ini tidak bisa disetujui karena statusnya sudah berubah.", 400);
  }
  if (!request.emailVerifiedAt) {
    throw new AppError("BUSINESS_RULE_VIOLATION", "Email registrasi belum diverifikasi.", 400);
  }

  await assertNoExistingAccount({ email: request.email, nik: request.nik, claimedNip: request.claimedNip, now: new Date() });

  let result: Awaited<ReturnType<typeof repo.approveRegistrationTransaction>>;
  try {
    result = await repo.approveRegistrationTransaction({
      request,
      reviewedByAdminId: input.actor.userId,
      reviewNote: null,
      userId: crypto.randomUUID(),
      employeeRecordId: crypto.randomUUID(),
      now: new Date(),
    });
  } catch (error) {
    if (!isStaleRegistrationTransition(error)) throw error;
    throw new AppError("BUSINESS_RULE_VIOLATION", "Registrasi ini sudah diproses oleh admin lain.", 400);
  }

  await logActivity({
    actorId: input.actor.userId,
    actorName: input.actor.name,
    actorRole: input.actor.role,
    eventType: SECURITY_EVENT_TYPE.USER_REGISTRATION_APPROVED,
    resource: `UserRegistrationRequest:${request.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { email: request.email, employeeId: result.employee.id },
  });

  const emailDelivery = await sendRegistrationApprovalEmail({ email: request.email, registrationId: request.id });

  return { id: result.registration.id, userId: result.user.id, employeeId: result.employee.id, emailDelivery };
}

export async function rejectRegistrationRequest(input: { id: string; actor: { userId: string; name: string; role: string } }) {
  const request = await repo.findRegistrationById(input.id);
  if (!request) throw new AppError("NOT_FOUND", "Registrasi tidak ditemukan.", 404);
  if (request.status !== REGISTRATION_STATUS.UNDER_REVIEW && request.status !== REGISTRATION_STATUS.EMAIL_PENDING) {
    throw new AppError("BUSINESS_RULE_VIOLATION", "Registrasi ini tidak bisa ditolak karena statusnya sudah berubah.", 400);
  }

  let rejected: UserRegistrationRequest;
  try {
    rejected = await repo.rejectRegistrationIfReviewable({
      id: request.id,
      reviewedByAdminId: input.actor.userId,
      now: new Date(),
    });
  } catch (error) {
    if (!isStaleRegistrationTransition(error)) throw error;
    throw new AppError("BUSINESS_RULE_VIOLATION", "Registrasi ini sudah diproses oleh admin lain.", 400);
  }

  await logActivity({
    actorId: input.actor.userId,
    actorName: input.actor.name,
    actorRole: input.actor.role,
    eventType: SECURITY_EVENT_TYPE.USER_REGISTRATION_REJECTED,
    resource: `UserRegistrationRequest:${request.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { email: request.email },
  });

  return { id: rejected.id, status: REGISTRATION_STATUS.REJECTED };
}

