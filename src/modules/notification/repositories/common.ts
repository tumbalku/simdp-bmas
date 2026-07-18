import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export function findNotificationsWithUnreadCount(input: {
  userId: string;
  page: number;
  pageSize: number;
  where: Record<string, unknown>;
}) {
  return prisma.$transaction([
    prisma.notification.findMany({
      where: input.where,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({
      where: { userId: input.userId, isRead: false },
    }),
  ]);
}

export function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export function findNotificationForUser(notificationId: string, userId: string) {
  return prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
}

export function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export function markUnreadNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export function createNotificationRecord(input: Prisma.NotificationUncheckedCreateInput) {
  return prisma.notification.create({
    data: input,
  });
}

export function findNotificationById(notificationId: string) {
  return prisma.notification.findUnique({
    where: { id: notificationId },
  });
}

export function findUserWithEmployeeById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
}

export function findDocumentWithTypeAndOwnerById(documentId: string) {
  return prisma.documentRecord.findUnique({
    where: { id: documentId },
    include: { documentType: true, owner: true },
  });
}

export function findLatestVerificationHistory(documentRecordId: string) {
  return prisma.verificationHistory.findFirst({
    where: { documentRecordId },
    orderBy: { reviewedAt: "desc" },
  });
}
