import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import type { StorageProviderValue } from "../constants";
import { prisma } from "./common";
import { documentTypeTargetInclude } from "./document-types";

type PreparedDocumentFile = {
  fileName: string;
  filePath: string;
};

async function lockDocumentSequence(tx: Prisma.TransactionClient, ownerId: string, documentTypeId: string) {
  // Serialize filename sequence reservation for one employee/document type pair.
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${ownerId}), hashtext(${documentTypeId}))
  `;
}

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
  prepareFile: (sequence: number) => Promise<PreparedDocumentFile>;
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
  return prisma.$transaction(async (tx) => {
    await lockDocumentSequence(tx, data.ownerId, data.documentTypeId);

    const existingCount = await tx.documentRecord.count({
      where: { ownerId: data.ownerId, documentTypeId: data.documentTypeId },
    });
    const { fileName, filePath } = await data.prepareFile(existingCount + 1);
    const replacedDocumentIds: string[] = [];

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
        fileName,
        filePath,
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
    const verificationRecipientUserIds = adminsAndStaff.map((user) => user.id);

    return { record: docRec, replacedDocumentIds, verificationRecipientUserIds };
  });
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
  ownerId: string;
  documentTypeId: string;
  prepareFile: (sequence: number) => Promise<PreparedDocumentFile>;
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
  return prisma.$transaction(async (tx) => {
    await lockDocumentSequence(tx, data.ownerId, data.documentTypeId);

    const existingCount = await tx.documentRecord.count({
      where: { ownerId: data.ownerId, documentTypeId: data.documentTypeId },
    });
    const { fileName, filePath } = await data.prepareFile(existingCount + 1);

    const record = await tx.documentRecord.update({
      where: { id: data.documentId },
      data: {
        status: "PENDING",
        isCurrent: true,
        title: data.title,
        fileName,
        filePath,
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
    const verificationRecipientUserIds = adminsAndStaff.map((user) => user.id);

    return { record, verificationRecipientUserIds };
  });
}
