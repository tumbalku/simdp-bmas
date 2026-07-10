/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { requireAuth, getSession, clearAuthCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePassword, revokeSession, revokeAllSessions, logoutUser } from "@/modules/auth/service";
import { cookies } from "next/headers";

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
    oldPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirmNewPassword"],
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        ok: false as const,
        error: {
          code: json?.error?.code ?? "AUTH_ERROR",
          message: json?.error?.message ?? "Login gagal. Periksa kembali identitas dan password Anda.",
        },
      };
    }

    // Forward Set-Cookie dari API ke browser melalui Server Action
    const rawCookies = res.headers.get("set-cookie");
    if (rawCookies) {
      const cookieStore = await cookies();
      // Parse dan set setiap cookie secara individual
      for (const raw of rawCookies.split(/,(?=[^ ])/)) {
        const [nameVal, ...attrs] = raw.trim().split(";").map((s) => s.trim());
        const eqIdx = nameVal.indexOf("=");
        const name = nameVal.slice(0, eqIdx);
        const value = nameVal.slice(eqIdx + 1);
        const attrMap: Record<string, string | boolean> = {};
        for (const attr of attrs) {
          const [k, v] = attr.split("=");
          attrMap[k.trim().toLowerCase()] = v?.trim() ?? true;
        }
        cookieStore.set(name, value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: attrMap["path"] as string ?? "/",
          ...(attrMap["max-age"] ? { maxAge: Number(attrMap["max-age"]) } : {}),
        });
      }
    }

    return { ok: true as const, data: json.data };
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        ok: false as const,
        error: {
          code: json?.error?.code ?? "REQUEST_ERROR",
          message: json?.error?.message ?? "Permintaan gagal. Coba beberapa saat lagi.",
        },
      };
    }

    return { ok: true as const, data: json.data };
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        ok: false as const,
        error: {
          code: json?.error?.code ?? "RESET_ERROR",
          message: json?.error?.message ?? "Reset password gagal. Token mungkin sudah kadaluarsa.",
        },
      };
    }

    return { ok: true as const, data: json.data };
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

    const { oldPassword, newPassword } = parsed.data;

    // Fetch user for actor name
    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });

    const actorName = user?.employee?.name || user?.email || "User";

    const success = await changePassword(
      session.userId,
      oldPassword,
      newPassword,
      actorName,
      session.role
    );

    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "BUSINESS_RULE_VIOLATION",
          message: "Password lama salah.",
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
        name: user.employee?.name || "User",
        email: user.email,
        role: user.role,
        avatarUrl: user.employee?.avatarUrl || null,
        employeeId: user.employee?.employeeId || null,
      },
    };
  } catch (error) {
    console.error("getSessionProfileAction error:", error);
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" } };
  }
}
