import { NOTIFICATION_RELATED_ENTITY_TYPE, NOTIFICATION_TYPE } from "@/modules/notification/constants";
import { prisma } from "./common";

export async function findExpiredApprovedDocuments(now: Date) {
  return prisma.documentRecord.findMany({
    where: {
      status: "APPROVED",
      deletedAt: null,
      expiryDate: { lte: now },
    },
    include: { owner: true, documentType: true },
  });
}

export async function updateDocumentStatus(id: string, status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED") {
  return prisma.documentRecord.update({
    where: { id },
    data: { status },
  });
}

export async function findSystemSettings() {
  return prisma.systemSetting.findMany();
}

export async function findDocumentsToRemind(h30Date: Date, h7Date: Date, h1Date: Date) {
  return prisma.documentRecord.findMany({
    where: {
      status: "APPROVED",
      deletedAt: null,
      expiryDate: { not: null },
      OR: [
        { expiryDate: h30Date, reminderH30SentAt: null },
        { expiryDate: h7Date, reminderH7SentAt: null },
        { expiryDate: h1Date, reminderH1SentAt: null },
      ],
    },
    include: {
      owner: true,
      documentType: true,
    },
  });
}

export async function createNotificationAndUpdateReminder(data: {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  relatedEntityId: string;
  documentRecordId: string;
  reminderField: "reminderH30SentAt" | "reminderH7SentAt" | "reminderH1SentAt";
}) {
  return prisma.$transaction([
    prisma.notification.create({
      data: {
        id: data.notificationId,
        userId: data.userId,
        type: NOTIFICATION_TYPE.EXPIRY_REMINDER,
        title: data.title,
        message: data.message,
        relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD,
        relatedEntityId: data.relatedEntityId,
      },
    }),
    prisma.documentRecord.update({
      where: { id: data.documentRecordId },
      data: { [data.reminderField]: new Date() },
    }),
  ]);
}
