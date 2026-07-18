/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requireAuth } from "@/lib/auth";
import {
  getNotifications as getNotificationsService,
  getUnreadNotificationCount as getUnreadCountService,
  markNotificationRead,
  markAllNotificationsRead,
} from "../service";

export async function getNotifications(filter?: { page?: number; pageSize?: number; isRead?: boolean }) {
  try {
    const session = await requireAuth();

    const result = await getNotificationsService(session.userId, filter);

    return { ok: true as const, ...result };
  } catch (error: any) {
    console.error("getNotifications error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function getUnreadNotificationCount() {
  try {
    const session = await requireAuth();

    const result = await getUnreadCountService(session.userId);

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("getUnreadNotificationCount error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    const session = await requireAuth();

    const success = await markNotificationRead(id, session.userId);

    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND",
          message: "Notifikasi tidak ditemukan.",
        },
      };
    }

    return { ok: true as const, data: { success: true } };
  } catch (error: any) {
    console.error("markNotificationReadAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await requireAuth();

    await markAllNotificationsRead(session.userId);

    return { ok: true as const, data: { success: true } };
  } catch (error: any) {
    console.error("markAllNotificationsReadAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}
