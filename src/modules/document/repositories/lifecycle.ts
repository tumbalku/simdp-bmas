import { NOTIFICATION_RELATED_ENTITY_TYPE } from "@/modules/notification";
import { prisma } from "./common";
import { withStoredFileMetadata } from "./stored-file";

export async function findDocumentRecordByFilePath(filePath: string) {
  const record = await prisma.documentRecord.findFirst({
    where: { storedFile: { filePath, deletedAt: null }, deletedAt: null },
    include: { owner: true, storedFile: true },
  });

  return record ? withStoredFileMetadata(record) : null;
}

export async function softDeleteDocumentRecord(id: string, updatedBy: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.documentRecord.findUnique({
      where: { id },
      select: { storedFileId: true },
    });

    if (!record) return null;

    const deletedAt = new Date();
    const updatedRecord = await tx.documentRecord.update({
      where: { id },
      data: { deletedAt, isCurrent: false, updatedBy },
    });
    await tx.storedFile.update({
      where: { id: record.storedFileId },
      data: { deletedAt },
    });

    return updatedRecord;
  });
}

export async function findDocumentRecordWithDeletedWithOwner(id: string) {
  const record = await prisma.documentRecord.findUnique({
    where: { id },
    include: {
      owner: true,
      storedFile: true,
      documentType: {
        select: {
          allowMultiple: true,
        },
      },
    },
  });

  return record ? withStoredFileMetadata(record) : null;
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
      storedFile: { select: { fileName: true } },
    },
  });
}

export async function restoreDocumentRecord(id: string, allowMultipleSnapshot: boolean, updatedBy: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.documentRecord.findUnique({
      where: { id },
      select: { storedFileId: true },
    });

    if (!record) return null;

    const updatedRecord = await tx.documentRecord.update({
      where: { id },
      data: { deletedAt: null, isCurrent: true, allowMultipleSnapshot, updatedBy },
    });
    await tx.storedFile.update({
      where: { id: record.storedFileId },
      data: { deletedAt: null },
    });

    return updatedRecord;
  });
}

export async function permanentlyDeleteDocumentRecord(id: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.documentRecord.findUnique({
      where: { id },
      select: { storedFileId: true },
    });

    if (!record) return null;

    await tx.notification.deleteMany({
      where: { relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD, relatedEntityId: id },
    });

    await tx.$executeRaw`SELECT set_config('app.allow_verification_history_purge', 'on', true)`;
    await tx.verificationHistory.deleteMany({ where: { documentRecordId: id } });
    await tx.documentRecord.delete({ where: { id } });
    await tx.storedFile.delete({ where: { id: record.storedFileId } });

    return record;
  });
}
