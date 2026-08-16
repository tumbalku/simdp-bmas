"use server";

import { z } from "zod";
import {
  requireAuth,
  getSession,
  clearAuthCookies,
  setAuthCookies,
  setTwoFactorChallengeCookie,
  getTwoFactorChallengeUserId,
  clearTwoFactorChallengeCookie,
} from "@/lib/auth";
import {
  clearSharedRateLimitBucket,
  getSharedRateLimitBucket,
  incrementSharedRateLimitBucket,
} from "@/lib/rate-limit-store";
import { logActivity, SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import {
  changePassword,
  getActiveSessions,
  getCurrentUserAccount,
  getSessionProfile,
  isLoginRateLimited,
  logRateLimitedLoginAttempt,
  revokeSession,
  revokeAllSessions,
  logoutUser,
  loginUser,
  createSessionForAuthenticatedUser,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyCurrentPassword,
} from "../service";
import {
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  isTwoFactorEnabled,
  sendTwoFactorEmailCode,
  verifyTwoFactorToken,
} from "../services/two-factor.service";
import { cookies, headers } from "next/headers";
import { findRefreshTokenByIdAndUserId, findUserWithEmployeeById } from "../repositories/common";

/* -------------------------------------------------------------------------- */
/*  Schemas                                                                     */
/* -------------------------------------------------------------------------- */

const loginSchema = z.object({
  identifier: z.string().min(1, "Identitas wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token wajib diisi"),
    newPassword: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Password baru harus berbeda dari password saat ini",
    path: ["newPassword"],
  });

const verifyCurrentPasswordSchema = z.object({
  password: z.string().min(1, "Password wajib diisi"),
});

const revokeSessionSchema = z.object({
  tokenId: z.string().min(1, "ID sesi wajib diisi"),
});

const twoFactorTokenSchema = z.object({ token: z.string().regex(/^\s*[A-Za-z0-9 -]{6,20}\s*$/, "Kode 2FA tidak valid") });

const PASSWORD_VERIFICATION_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const PASSWORD_VERIFICATION_MAX_FAILED_ATTEMPTS = 5;
const TWO_FACTOR_VERIFICATION_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const TWO_FACTOR_VERIFICATION_MAX_FAILED_ATTEMPTS = 5;

async function isTwoFactorRateLimited(userId: string) {
  const bucket = await getSharedRateLimitBucket(`AUTH_2FA_VERIFY:${userId}`);
  return bucket ? bucket.count >= TWO_FACTOR_VERIFICATION_MAX_FAILED_ATTEMPTS : false;
}

async function recordTwoFactorFailure(userId: string) {
  const bucket = await incrementSharedRateLimitBucket({
    key: `AUTH_2FA_VERIFY:${userId}`,
    category: "AUTH_2FA_VERIFY",
    windowMs: TWO_FACTOR_VERIFICATION_THROTTLE_WINDOW_MS,
  });
  return bucket.count;
}

async function getPasswordVerificationThrottle(key: string) {
  const bucket = await getSharedRateLimitBucket(`AUTH_PASSWORD_VERIFY:${key}`);
  return { count: bucket?.count ?? 0 };
}

async function recordPasswordVerificationFailure(key: string) {
  const bucket = await incrementSharedRateLimitBucket({
    key: `AUTH_PASSWORD_VERIFY:${key}`,
    category: "AUTH_PASSWORD_VERIFY",
    windowMs: PASSWORD_VERIFICATION_THROTTLE_WINDOW_MS,
  });
  return bucket.count;
}



/* -------------------------------------------------------------------------- */
/*  loginAction                                                                 */
/* -------------------------------------------------------------------------- */

export async function loginAction(data: unknown) {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Input tidak valid.",
        details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    };
  }

  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || null;
    const userAgent = headersList.get("user-agent") || null;

    const { identifier, password } = parsed.data;
    if (await isLoginRateLimited(ipAddress)) {
      await logRateLimitedLoginAttempt(ipAddress);

      return {
        ok: false as const,
        error: {
          code: "RATE_LIMITED",
          message: "Terlalu banyak percobaan login gagal. Coba lagi 15 menit kemudian.",
        },
      };
    }

    const result = await loginUser(identifier, password, ipAddress, userAgent, { createSession: false });

    if (!result) {
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED",
          message: "Identitas atau password salah.",
        },
      };
    }

    if (await isTwoFactorEnabled(result.user.id)) {
      await setTwoFactorChallengeCookie(result.user.id);
      return { ok: true as const, data: { requiresTwoFactor: true } };
    }

    const session = await createSessionForAuthenticatedUser(result.user, ipAddress, userAgent);
    await setAuthCookies(session.user.id, session.user.role, session.user.employeeId, session.refreshTokenPlain);

    return { ok: true as const, data: { user: result.user } };
  } catch (error: unknown) {
    console.error("loginAction error:", error);
    return {
      ok: false as const,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba beberapa saat lagi." },
    };
  }
}

export async function verifyTwoFactorLoginAction(data: unknown) {
  const parsed = twoFactorTokenSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Kode 2FA tidak valid." } };

  try {
    const userId = await getTwoFactorChallengeUserId();
    if (!userId) {
      return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "Kode 2FA salah atau sudah kedaluwarsa." } };
    }
    if (await isTwoFactorRateLimited(userId)) return { ok: false as const, error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan 2FA. Coba lagi 10 menit kemudian." } };
    if (!(await verifyTwoFactorToken(userId, parsed.data.token))) {
      const count = await recordTwoFactorFailure(userId);
      await logActivity({ actorId: userId, actorName: "User", actorRole: SECURITY_ACTOR_ROLE.PUBLIC, eventType: SECURITY_EVENT_TYPE.AUTH_2FA_CHALLENGE_FAILED, resource: `User:${userId}`, status: SECURITY_LOG_STATUS.FAILED, metadata: { attempt: count } });
      return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "Kode 2FA salah atau sudah kedaluwarsa." } };
    }

    const user = await findUserWithEmployeeById(userId);
    if (!user || !user.isActive || user.deletedAt) {
      return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "Akun tidak tersedia." } };
    }

    const session = await createSessionForAuthenticatedUser(
      { id: user.id, email: user.email, role: user.role, employeeId: user.employee?.id ?? null },
      (await headers()).get("x-forwarded-for"),
      (await headers()).get("user-agent"),
    );
    await setAuthCookies(session.user.id, session.user.role, session.user.employeeId, session.refreshTokenPlain);
    await clearTwoFactorChallengeCookie();
    await logActivity({ actorId: user.id, actorName: user.employee?.name || user.email, actorRole: user.role, eventType: SECURITY_EVENT_TYPE.AUTH_2FA_SUCCESS, resource: `User:${user.id}`, status: SECURITY_LOG_STATUS.SUCCESS });
    return { ok: true as const, data: { user: session.user } };
  } catch (error: unknown) {
    console.error("verifyTwoFactorLoginAction error:", error);
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  }
}

export async function sendTwoFactorEmailCodeAction() {
  try {
    const userId = await getTwoFactorChallengeUserId();
    if (!userId) return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "Sesi verifikasi 2FA sudah kedaluwarsa." } };
    const user = await findUserWithEmployeeById(userId);
    if (!user) return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "Akun tidak tersedia." } };

    const result = await sendTwoFactorEmailCode(userId, user.email);
    if (!result.sent) {
      const message = result.reason === "COOLDOWN"
        ? `Tunggu ${result.retryAfterSeconds} detik sebelum meminta kode baru.`
        : result.reason === "EMAIL_NOT_CONFIGURED"
          ? "Pengiriman email belum dikonfigurasi. Hubungi administrator."
          : "2FA belum aktif pada akun ini.";
      return { ok: false as const, error: { code: result.reason, message } };
    }

    await logActivity({ actorId: userId, actorName: user.employee?.name || user.email, actorRole: SECURITY_ACTOR_ROLE.PUBLIC, eventType: SECURITY_EVENT_TYPE.AUTH_2FA_EMAIL_SENT, resource: `User:${userId}`, status: SECURITY_LOG_STATUS.SUCCESS, metadata: { expiresInSeconds: result.expiresInSeconds } });
    return { ok: true as const, data: { maskedEmail: result.maskedEmail, expiresInSeconds: result.expiresInSeconds } };
  } catch (error: unknown) {
    console.error("sendTwoFactorEmailCodeAction error:", error);
    return { ok: false as const, error: { code: "EMAIL_SEND_FAILED", message: "Kode email gagal dikirim. Coba lagi nanti." } };
  }
}

export async function beginTwoFactorSetupAction() {
  try {
    const session = await requireAuth();
    const account = await getCurrentUserAccount(session.userId);
    if (!account) return { ok: false as const, error: { code: "NOT_FOUND", message: "Akun tidak ditemukan." } };
    const setup = await beginTwoFactorSetup(session.userId, account.email);
    if (!setup) return { ok: false as const, error: { code: "CONFLICT", message: "2FA sudah aktif pada akun ini." } };
    return { ok: true as const, data: setup };
  } catch {
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Setup 2FA gagal." } };
  }
}

export async function confirmTwoFactorSetupAction(data: unknown) {
  const parsed = twoFactorTokenSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Kode 2FA tidak valid." } };
  try {
    const session = await requireAuth();
    const account = await getCurrentUserAccount(session.userId);
    const result = await confirmTwoFactorSetup(session.userId, parsed.data.token, account?.employeeName || account?.email || "User", session.role);
    if (!result) return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "Kode 2FA salah." } };
    return { ok: true as const, data: result };
  } catch {
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Konfirmasi 2FA gagal." } };
  }
}

export async function disableTwoFactorAction(data: unknown) {
  const parsed = twoFactorTokenSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Kode 2FA tidak valid." } };
  try {
    const session = await requireAuth();
    if (!(await verifyTwoFactorToken(session.userId, parsed.data.token))) return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "Kode 2FA salah." } };
    const account = await getCurrentUserAccount(session.userId);
    await disableTwoFactor(session.userId, account?.employeeName || account?.email || "User", session.role);
    return { ok: true as const, data: { disabled: true } };
  } catch {
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "2FA gagal dinonaktifkan." } };
  }
}

/* -------------------------------------------------------------------------- */
/*  forgotPasswordAction                                                        */
/* -------------------------------------------------------------------------- */

export async function forgotPasswordAction(data: unknown) {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Input tidak valid.",
        details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    };
  }

  try {
    const { email } = parsed.data;
    await requestPasswordReset(email);

    return { ok: true as const, data: { success: true } };
  } catch (error: unknown) {
    console.error("forgotPasswordAction error:", error);
    return {
      ok: false as const,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba beberapa saat lagi." },
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  resetPasswordAction                                                         */
/* -------------------------------------------------------------------------- */

export async function resetPasswordAction(data: unknown) {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Input tidak valid.",
        details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    };
  }

  try {
    const { token, newPassword } = parsed.data;
    const success = await resetPasswordWithToken(token, newPassword);

    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "RESET_ERROR",
          message: "Reset password gagal. Token mungkin sudah kadaluarsa atau tidak valid.",
        },
      };
    }

    return { ok: true as const, data: { success: true } };
  } catch (error: unknown) {
    console.error("resetPasswordAction error:", error);
    return {
      ok: false as const,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba beberapa saat lagi." },
    };
  }
}



export async function changePasswordAction(data: unknown) {
  try {
    const session = await requireAuth();

    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input tidak valid.",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      };
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch user for actor name
    const user = await findUserWithEmployeeById(session.userId);

    const actorName = user?.employee?.name || user?.email || "User";

    const success = await changePassword(
      session.userId,
      currentPassword,
      newPassword,
      actorName,
      session.role
    );

    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "BUSINESS_RULE_VIOLATION",
          message: "Password saat ini tidak sesuai atau password baru tidak valid.",
        },
      };
    }

    return { ok: true as const, data: { success: true } };
  } catch (error: unknown) {
    console.error("changePasswordAction error:", error);
    const isUnauth = error instanceof Error && error.message === "UNAUTHENTICATED";
    return {
      ok: false as const,
      error: {
        code: isUnauth ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: isUnauth ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function verifyCurrentPasswordAction(data: unknown) {
  try {
    const session = await requireAuth();
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const throttleKey = `${session.userId}:${ipAddress}`;
    const throttle = await getPasswordVerificationThrottle(throttleKey);
    const user = await findUserWithEmployeeById(session.userId);
    const actorName = user?.employee?.name || user?.email || "User";

    if (throttle.count >= PASSWORD_VERIFICATION_MAX_FAILED_ATTEMPTS) {
      await logActivity({
        actorId: session.userId,
        actorName,
        actorRole: session.role,
        eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_VERIFICATION_FAILED,
        resource: `User:${session.userId}`,
        status: SECURITY_LOG_STATUS.FAILED,
        metadata: { reason: "RATE_LIMITED", ipAddress },
      });

      return {
        ok: false as const,
        error: {
          code: "RATE_LIMITED",
          message: "Terlalu banyak percobaan verifikasi password. Coba lagi beberapa menit lagi.",
        },
      };
    }

    const parsed = verifyCurrentPasswordSchema.safeParse(data);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Input tidak valid.",
          details: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      };
    }

    const isValid = await verifyCurrentPassword(session.userId, parsed.data.password);

    if (!isValid) {
      const failedAttemptCount = await recordPasswordVerificationFailure(throttleKey);

      await logActivity({
        actorId: session.userId,
        actorName,
        actorRole: session.role,
        eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_VERIFICATION_FAILED,
        resource: `User:${session.userId}`,
        status: SECURITY_LOG_STATUS.FAILED,
        metadata: { reason: "PASSWORD_MISMATCH", failedAttemptCount, ipAddress },
      });

      return {
        ok: false as const,
        error: { code: "UNAUTHENTICATED", message: "Password tidak sesuai." },
      };
    }

    await clearSharedRateLimitBucket(`AUTH_PASSWORD_VERIFY:${throttleKey}`);

    await logActivity({
      actorId: session.userId,
      actorName,
      actorRole: session.role,
      eventType: SECURITY_EVENT_TYPE.AUTH_PASSWORD_VERIFICATION_SUCCESS,
      resource: `User:${session.userId}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { ipAddress },
    });

    return { ok: true as const, data: { verified: true } };
  } catch (error: unknown) {
    console.error("verifyCurrentPasswordAction error:", error);
    const isUnauth = error instanceof Error && error.message === "UNAUTHENTICATED";
    return {
      ok: false as const,
      error: {
        code: isUnauth ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: isUnauth ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function getCurrentAccountSettingsAction() {
  try {
    const session = await requireAuth();
    const account = await getCurrentUserAccount(session.userId);

    if (!account) {
      return {
        ok: false as const,
        error: { code: "NOT_FOUND", message: "Akun tidak ditemukan." },
      };
    }

    const sessions = await getActiveSessions(session.userId);

    return { ok: true as const, data: { account, sessions } };
  } catch (error: unknown) {
    console.error("getCurrentAccountSettingsAction error:", error);
    const isUnauth = error instanceof Error && error.message === "UNAUTHENTICATED";
    return {
      ok: false as const,
      error: {
        code: isUnauth ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: isUnauth ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function revokeSessionAction(tokenId: string) {
  try {
    const session = await requireAuth();
    const parsed = revokeSessionSchema.safeParse({ tokenId });

    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Input tidak valid.",
        },
      };
    }

    // Check ownership
    const tokenRecord = await findRefreshTokenByIdAndUserId(parsed.data.tokenId, session.userId);

    if (!tokenRecord) {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND",
          message: "Sesi tidak ditemukan atau bukan milik Anda.",
        },
      };
    }

    const user = await findUserWithEmployeeById(session.userId);
    const actorName = user?.employee?.name || user?.email || "User";

    const success = await revokeSession(session.userId, parsed.data.tokenId, actorName, session.role);
    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal merevoke sesi.",
        },
      };
    }

    return { ok: true as const, data: { success: true } };
  } catch (error: unknown) {
    console.error("revokeSessionAction error:", error);
    const isUnauth = error instanceof Error && error.message === "UNAUTHENTICATED";
    return {
      ok: false as const,
      error: {
        code: isUnauth ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: isUnauth ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function revokeAllSessionsAction() {
  try {
    const session = await requireAuth();

    const user = await findUserWithEmployeeById(session.userId);
    const actorName = user?.employee?.name || user?.email || "User";

    const success = await revokeAllSessions(session.userId, actorName, session.role);
    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal merevoke semua sesi.",
        },
      };
    }

    await clearAuthCookies();

    return { ok: true as const, data: { success: true } };
  } catch (error: unknown) {
    console.error("revokeAllSessionsAction error:", error);
    const isUnauth = error instanceof Error && error.message === "UNAUTHENTICATED";
    return {
      ok: false as const,
      error: {
        code: isUnauth ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: isUnauth ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function logoutAction() {
  try {
    const session = await getSession();
    if (session) {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get("refresh_token")?.value;
      if (refreshToken) {
        await logoutUser(refreshToken, session.userId);
      }
    }
    await clearAuthCookies();
    return { ok: true as const, data: { success: true } };
  } catch (error: unknown) {
    console.error("logoutAction error:", error);
    return {
      ok: false as const,
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan internal",
      },
    };
  }
}

export async function getSessionProfileAction() {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false as const, error: { code: "UNAUTHENTICATED", message: "User belum login" } };
    }
    const profile = await getSessionProfile(session.userId);
    if (!profile) {
      return { ok: false as const, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }
    return { ok: true as const, data: profile };
  } catch (error) {
    console.error("getSessionProfileAction error:", error);
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" } };
  }
}

