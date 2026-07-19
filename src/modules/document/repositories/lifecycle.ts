import { NOTIFICATION_RELATED_ENTITY_TYPE } from "@/modules/notification";
import { prisma } from "./common";

export async function findDocumentRecordByFilePath(filePath: string) {
  return prisma.documentRecord.findFirst({
    where: { filePath, deletedAt: null },
    include: { owner: true },
  });
}

export async function softDeleteDocumentRecord(id: string) {
  return prisma.documentRecord.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isCurrent: false,
    },
  });
}

export async function findDocumentRecordWithDeletedWithOwner(id: string) {
  return prisma.documentRecord.findUnique({
    where: { id },
    include: {
      owner: true,
      documentType: {
        select: {
          allowMultiple: true,
        },
      },
    },
  });
}

export async function findActiveDocumentRecordByOwnerAndType(ownerId: string, documentTypeId: string) {
  return prisma.documentRecord.findFirst({
    where: {
      ownerId,
      documentTypeId,
      deletedAt: null,
      isCurrent: true,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
    },
  });
}

export async function restoreDocumentRecord(id: string, allowMultipleSnapshot: boolean) {
  return prisma.documentRecord.update({
    where: { id },
    data: {
      deletedAt: null,
      isCurrent: true,
      allowMultipleSnapshot,
    },
  });
}

export async function permanentlyDeleteDocumentRecord(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({
      where: { relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD, relatedEntityId: id },
    });

    await tx.documentRecord.delete({ where: { id } });
  });
}
