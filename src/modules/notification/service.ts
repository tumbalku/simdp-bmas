/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { realtimeProvider, emailProvider, jobProvider } from "@/lib/notifications";
import {
  NOTIFICATION_RELATED_ENTITY_TYPE,
  NOTIFICATION_TYPE,
  mapNotificationRelatedEntityTypeLegacyToCanonical,
  mapNotificationTypeToCanonical,
} from "./constants";

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

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  message?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}) {
  const id = crypto.randomUUID();
  const notif = await prisma.notification.create({
    data: {
      id,
      userId: input.userId,
      type: mapNotificationTypeToCanonical(input.type),
      title: input.title,
      message: input.message || null,
      relatedEntityType: mapNotificationRelatedEntityTypeLegacyToCanonical(input.relatedEntityType),
      relatedEntityId: input.relatedEntityId || null,
    },
  });

  await enqueueNotificationDispatch({
    notificationId: notif.id,
    userId: notif.userId,
  });

  return notif;
}

export async function enqueueNotificationDispatch(input: {
  notificationId: string;
  userId: string;
}) {
  await jobProvider.enqueueNotification(input);
}

export async function dispatchNotification(input: {
  notificationId: string;
  email?: string;
}) {
  const notification = await prisma.notification.findUnique({
    where: { id: input.notificationId },
  });

  if (!notification) {
    throw new Error(`Notification with ID ${input.notificationId} not found.`);
  }

  // 1. Publish realtime notification
  await realtimeProvider.publishToUser(notification.userId, {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    createdAt: notification.createdAt.toISOString(),
  });

  // 2. Send email notification if recipient email exists or input email is provided
  const user = await prisma.user.findUnique({
    where: { id: notification.userId },
    include: { employee: true },
  });

  const recipientEmail = input.email || user?.email;
  if (recipientEmail) {
    let html = "";
    const {
      renderDocumentStatusEmail,
      renderGeneralNotificationEmail,
    } = await import("@/lib/notifications/email-renderer");

    if (
      (notification.type === NOTIFICATION_TYPE.DOCUMENT_STATUS ||
        notification.type === NOTIFICATION_TYPE.DOCUMENT_VERIFICATION) &&
      notification.relatedEntityType === NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD &&
      notification.relatedEntityId
    ) {
      const doc = await prisma.documentRecord.findUnique({
        where: { id: notification.relatedEntityId },
        include: { documentType: true, owner: true },
      });

      if (doc && (doc.status === "APPROVED" || doc.status === "REJECTED")) {
        const history = await prisma.verificationHistory.findFirst({
          where: { documentRecordId: doc.id },
          orderBy: { reviewedAt: "desc" },
        });

        html = await renderDocumentStatusEmail({
          ownerName: doc.owner.name,
          documentTypeName: doc.documentType.name,
          status: doc.status as "APPROVED" | "REJECTED",
          note: history?.reviewNote,
        });
      }
    }

    if (!html) {
      html = await renderGeneralNotificationEmail({
        title: notification.title,
        message: notification.message || "",
      });
    }

    await emailProvider.sendEmail({
      to: recipientEmail,
      subject: notification.title,
      html,
    });
  }
}
