import { PAGINATION } from "@/constants";
import type { NavbarNotification } from "./hooks";

type NotificationListPayload = {
  ok: true;
  data: NavbarNotification[];
  meta: {
    unreadCount: number;
  };
};

type ErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export async function fetchNavbarNotifications(
  filter: { page?: number; pageSize?: number; isRead?: boolean } = {},
) {
  const params = new URLSearchParams();
  params.set("page", String(filter.page ?? PAGINATION.defaultPage));
  params.set("pageSize", String(filter.pageSize ?? PAGINATION.navbarNotificationLimit));
  if (filter.isRead !== undefined) params.set("isRead", String(filter.isRead));

  const response = await fetch(`/api/v1/notifications?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  const payload = (await response.json()) as NotificationListPayload | ErrorEnvelope;

  if (!response.ok) {
    const message = payload.ok ? "Gagal memuat notifikasi." : payload.error.message;
    throw new Error(message);
  }

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload;
}
