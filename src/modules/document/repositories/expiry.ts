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

export async function findDocumentsToRemind(input: {
  h30Start: Date;
  h30End: Date;
  h7Start: Date;
  h7End: Date;
  h1Start: Date;
  h1End: Date;
}) {
  return prisma.documentRecord.findMany({
    where: {
      status: "APPROVED",
      deletedAt: null,
      expiryDate: { not: null },
      OR: [
        { expiryDate: { gte: input.h30Start, lt: input.h30End }, reminderH30SentAt: null },
        { expiryDate: { gte: input.h7Start, lt: input.h7End }, reminderH7SentAt: null },
        { expiryDate: { gte: input.h1Start, lt: input.h1End }, reminderH1SentAt: null },
      ],
    },
    include: {
      owner: true,
      documentType: true,
    },
  });
}

export async function updateReminderSentAt(data: {
  documentRecordId: string;
  reminderField: "reminderH30SentAt" | "reminderH7SentAt" | "reminderH1SentAt";
}) {
  return prisma.documentRecord.update({
    where: { id: data.documentRecordId },
    data: { [data.reminderField]: new Date() },
  });
}
