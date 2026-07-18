import crypto from "crypto";
import type { StorageProviderValue } from "../constants";
import { prisma } from "./common";
import { documentTypeTargetInclude } from "./document-types";

export async function countDocumentRecords(ownerId: string, documentTypeId: string) {
  return prisma.documentRecord.count({
    where: { ownerId, documentTypeId },
  });
}

export async function countActiveDocumentRecords(ownerId: string, documentTypeId: string) {
  return prisma.documentRecord.count({
    where: { ownerId, documentTypeId, isCurrent: true, deletedAt: null },
  });
}

export async function createUploadedDocumentTransaction(data: {
  docId: string;
  ownerId: string;
  documentTypeId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType: string | null;
  fileHash: string;
  storageProvider: StorageProviderValue;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  createdBy: string;
  allowMultiple: boolean;
  documentTypeName: string;
  ownerName: string;
}) {
  const replacedDocumentIds: string[] = [];
  let verificationRecipientUserIds: string[] = [];
  const record = await prisma.$transaction(async (tx) => {
    if (!data.allowMultiple) {
      const activeDocs = await tx.documentRecord.findMany({
        where: { ownerId: data.ownerId, documentTypeId: data.documentTypeId, isCurrent: true, deletedAt: null },
      });

      if (activeDocs.length > 0) {
        await tx.documentRecord.updateMany({
          where: { ownerId: data.ownerId, documentTypeId: data.documentTypeId, isCurrent: true },
          data: { isCurrent: false, status: "REPLACED" },
        });

        replacedDocumentIds.push(...activeDocs.map((doc) => doc.id));
      }
    }

    const docRec = await tx.documentRecord.create({
      data: {
        id: data.docId,
        ownerId: data.ownerId,
        documentTypeId: data.documentTypeId,
        title: data.title,
        status: "PENDING",
        isCurrent: true,
        allowMultipleSnapshot: data.allowMultiple,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        fileHash: data.fileHash,
        storageProvider: data.storageProvider,
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        createdBy: data.createdBy,
      },
    });

    await tx.verificationHistory.create({
      data: {
        id: crypto.randomUUID(),
        documentRecordId: data.docId,
        status: "PENDING",
        reviewNote: "Sistem: Menunggu verifikasi dokumen baru.",
      },
    });

    const adminsAndStaff = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] }, isActive: true, deletedAt: null },
      select: { id: true },
    });
    verificationRecipientUserIds = adminsAndStaff.map((user) => user.id);

    return docRec;
  });

  return { record, replacedDocumentIds, verificationRecipientUserIds };
}

export async function findDocumentRecordWithOwner(id: string) {
  return prisma.documentRecord.findUnique({
    where: { id, deletedAt: null },
    include: { owner: true },
  });
}

export async function findDocumentRecordWithOwnerAndDocumentType(id: string) {
  return prisma.documentRecord.findUnique({
    where: { id, deletedAt: null },
    include: {
      owner: {
        include: {
          employeePosition: { select: { professionGroupId: true } },
        },
      },
      documentType: {
        include: documentTypeTargetInclude,
      },
    },
  });
}

export async function replaceDocumentFileTransaction(data: {
  documentId: string;
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType: string | null;
  fileHash: string;
  storageProvider: StorageProviderValue;
  updatedBy: string;
  documentTypeName: string;
  ownerName: string;
  title: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
}) {
  let verificationRecipientUserIds: string[] = [];
  return prisma.$transaction(async (tx) => {
    const record = await tx.documentRecord.update({
      where: { id: data.documentId },
      data: {
        status: "PENDING",
        isCurrent: true,
        title: data.title,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        fileHash: data.fileHash,
        storageProvider: data.storageProvider,
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
        uploadedAt: new Date(),
        reminderH30SentAt: null,
        reminderH7SentAt: null,
        reminderH1SentAt: null,
      },
    });

    await tx.verificationHistory.create({
      data: {
        id: crypto.randomUUID(),
        documentRecordId: data.documentId,
        status: "PENDING",
        reviewedById: data.updatedBy,
        reviewNote: "Sistem: File dokumen diganti dan menunggu verifikasi ulang.",
      },
    });

    const adminsAndStaff = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] }, isActive: true, deletedAt: null },
      select: { id: true },
    });
    verificationRecipientUserIds = adminsAndStaff.map((user) => user.id);

    return { record, verificationRecipientUserIds };
  });
}
