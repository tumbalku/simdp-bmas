/* eslint-disable @typescript-eslint/no-explicit-any */
import * as repo from "../repositories/common";

export async function getNotifications(
  userId: string,
  filter?: { page?: number; pageSize?: number; isRead?: boolean }
) {
  const page = filter?.page || 1;
  const pageSize = filter?.pageSize || 15;

  const where: any = {
    userId,
  };

  if (filter?.isRead !== undefined) {
    where.isRead = filter.isRead;
  }

  const [items, unreadCount] = await repo.findNotificationsWithUnreadCount({
    userId,
    page,
    pageSize,
    where,
  });

  const mappedData = items.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    relatedEntityType: n.relatedEntityType,
    relatedEntityId: n.relatedEntityId,
    createdAt: n.createdAt.toISOString(),
  }));

  return {
    data: mappedData,
    meta: {
      unreadCount,
    },
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const unreadCount = await repo.countUnreadNotifications(userId);

  return { unreadCount };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notif = await repo.findNotificationForUser(notificationId, userId);

  if (!notif) return false;

  await repo.markNotificationAsRead(notificationId);

  return true;
}

export async function markAllNotificationsRead(userId: string) {
  await repo.markUnreadNotificationsAsRead(userId);

  return true;
}
