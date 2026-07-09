/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

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

  const [items, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

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
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { unreadCount };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notif = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notif) return false;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return true;
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return true;
}
