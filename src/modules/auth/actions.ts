/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { requireAuth, getSession, clearAuthCookies, setAuthCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changePassword,
  getCurrentUserAccount,
  revokeSession,
  revokeAllSessions,
  logoutUser,
  loginUser,
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/modules/auth/service";
import { cookies, headers } from "next/headers";

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
    const success = await requestPasswordReset(email);

    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "REQUEST_ERROR",
          message: "Email tidak ditemukan atau tidak aktif.",
        },
      };
    }

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
    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });

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

    return { ok: true as const, data: account };
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

    // Check ownership
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { id: tokenId, userId: session.userId },
    });

    if (!tokenRecord) {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND",
          message: "Sesi tidak ditemukan atau bukan milik Anda.",
        },
      };
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });
    const actorName = user?.employee?.name || user?.email || "User";

    const success = await revokeSession(session.userId, tokenId, actorName, session.role);
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

    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });
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
    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });
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
