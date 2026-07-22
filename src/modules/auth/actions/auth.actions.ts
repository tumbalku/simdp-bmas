/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { requireAuth, getSession, clearAuthCookies, setAuthCookies } from "@/lib/auth";
import { logActivity, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import {
  changePassword,
  getActiveSessions,
  getCurrentUserAccount,
  isLoginRateLimited,
  logRateLimitedLoginAttempt,
  revokeSession,
  revokeAllSessions,
  logoutUser,
  loginUser,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyCurrentPassword,
} from "../service";
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

const PASSWORD_VERIFICATION_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const PASSWORD_VERIFICATION_MAX_FAILED_ATTEMPTS = 5;

const passwordVerificationAttempts = new Map<string, { count: number; firstAttemptAt: number }>();

function getPasswordVerificationThrottle(key: string) {
  const now = Date.now();
  const current = passwordVerificationAttempts.get(key);

  if (!current || now - current.firstAttemptAt > PASSWORD_VERIFICATION_THROTTLE_WINDOW_MS) {
    const next = { count: 0, firstAttemptAt: now };
    passwordVerificationAttempts.set(key, next);
    return next;
  }

  return current;
}

function recordPasswordVerificationFailure(key: string) {
  const current = getPasswordVerificationThrottle(key);
  current.count += 1;
  passwordVerificationAttempts.set(key, current);
  return current.count;
}

function clearPasswordVerificationThrottle(key: string) {
  passwordVerificationAttempts.delete(key);
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

    const result = await loginUser(identifier, password, ipAddress, userAgent);

    if (!result) {
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED",
          message: "Identitas atau password salah.",
        },
      };
    }

    await setAuthCookies(
      result.user.id,
      result.user.role,
      result.user.employeeId,
      result.refreshTokenPlain
    );

    return { ok: true as const, data: { user: result.user } };
  } catch (error: any) {
    console.error("loginAction error:", error);
    return {
      ok: false as const,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba beberapa saat lagi." },
    };
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    console.error("changePasswordAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
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
    const throttle = getPasswordVerificationThrottle(throttleKey);
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
      const failedAttemptCount = recordPasswordVerificationFailure(throttleKey);

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

    clearPasswordVerificationThrottle(throttleKey);

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
  } catch (error: any) {
    console.error("verifyCurrentPasswordAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
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
  } catch (error: any) {
    console.error("getCurrentAccountSettingsAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
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
  } catch (error: any) {
    console.error("revokeSessionAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
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
  } catch (error: any) {
    console.error("revokeAllSessionsAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
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
        await logoutUser(refreshToken, session.userId, session.role);
      }
    }
    await clearAuthCookies();
    return { ok: true as const, data: { success: true } };
  } catch (error: any) {
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
    const user = await findUserWithEmployeeById(session.userId);
    if (!user) {
      return { ok: false as const, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }
    return {
      ok: true as const,
      data: {
        userId: user.id,
        name: user.employee?.name || "User",
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: user.employee?.avatarUrl || null,
        employeeId: user.employee?.employeeId || null,
      },
    };
  } catch (error) {
    console.error("getSessionProfileAction error:", error);
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" } };
  }
}

