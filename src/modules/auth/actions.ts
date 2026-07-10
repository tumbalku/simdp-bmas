/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { requireAuth, getSession, clearAuthCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePassword, revokeSession, revokeAllSessions, logoutUser } from "@/modules/auth/service";
import { cookies } from "next/headers";

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
