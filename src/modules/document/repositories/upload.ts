import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import type { StorageProviderValue } from "../constants";
import { prisma } from "./common";
import { documentTypeTargetInclude } from "./document-types";
import { withStoredFileMetadata } from "./stored-file";

type PreparedDocumentFile = {
  fileName: string;
  uploadPath: string;
};

type ReservedDocumentFile = PreparedDocumentFile & {
  storedFileId: string;
};

type ReplacedDocumentSnapshot = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED";
};

async function lockDocumentSequence(tx: Prisma.TransactionClient, ownerId: string, documentTypeId: string) {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${ownerId}), hashtext(${documentTypeId}))
  `;
}

export async function countDocumentRecords(ownerId: string, documentTypeId: string) {
  return prisma.documentRecord.count({ where: { ownerId, documentTypeId } });
}

export async function countActiveDocumentRecords(ownerId: string, documentTypeId: string) {
  return prisma.documentRecord.count({
    where: { ownerId, documentTypeId, isCurrent: true, deletedAt: null },
  });
}

export async function reserveDocumentFileTransaction(data: {
  storedFileId: string;
  ownerId: string;
  documentTypeId: string;
  buildFile: (sequence: number) => PreparedDocumentFile;
  fileSize: bigint;
  mimeType: string;
  fileHash: string;
  storageProvider: StorageProviderValue;
  uploadedBy: string;
}): Promise<ReservedDocumentFile> {
  return prisma.$transaction(async (tx) => {
    await lockDocumentSequence(tx, data.ownerId, data.documentTypeId);

    const existingCount = await tx.documentRecord.count({
      where: { ownerId: data.ownerId, documentTypeId: data.documentTypeId },
    });
    const { fileName, uploadPath } = data.buildFile(existingCount + 1);

    await tx.storedFile.create({
      data: {
        id: data.storedFileId,
        fileName,
        filePath: uploadPath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        fileHash: data.fileHash,
        storageProvider: data.storageProvider,
        uploadedBy: data.uploadedBy,
      },
    });

    return { storedFileId: data.storedFileId, fileName, uploadPath };
  });
}

export async function finalizeDocumentUploadTransaction(data: {
  docId: string;
  storedFileId: string;
  savedPath: string;
  ownerId: string;
  documentTypeId: string;
  title: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  createdBy: string;
  replacesDocumentId: string | null;
  allowMultiple?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const storedFile = await tx.storedFile.update({
      where: { id: data.storedFileId },
      data: { filePath: data.savedPath },
    });

    const replacedDocuments: ReplacedDocumentSnapshot[] = data.replacesDocumentId
      ? await tx.documentRecord.findMany({
          where: { id: data.replacesDocumentId, deletedAt: null, isCurrent: true },
          select: { id: true, status: true },
        })
      : data.allowMultiple
        ? []
        : await tx.documentRecord.findMany({
            where: {
              ownerId: data.ownerId,
              documentTypeId: data.documentTypeId,
              deletedAt: null,
              isCurrent: true,
            },
            select: { id: true, status: true },
          });

    const documentRecord = await tx.documentRecord.create({
      data: {
        id: data.docId,
        ownerId: data.ownerId,
        documentTypeId: data.documentTypeId,
        storedFileId: data.storedFileId,
        replacesDocumentId: data.replacesDocumentId,
        title: data.title,
        status: "PENDING",
        isCurrent: true,
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        createdBy: data.createdBy,
      },
    });

    if (documentRecord.status === "PENDING") {
      await tx.verificationHistory.create({
        data: {
          id: crypto.randomUUID(),
          documentRecordId: data.docId,
          status: "PENDING",
          reviewNote: data.replacesDocumentId
            ? "Sistem: File dokumen diganti dan menunggu verifikasi ulang."
            : "Sistem: Menunggu verifikasi dokumen baru.",
        },
      });
    }

    const adminsAndStaff = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] }, isActive: true, deletedAt: null },
      select: { id: true },
    });

    return {
      record: withStoredFileMetadata({ ...documentRecord, storedFile }),
      replacedDocuments,
      verificationRecipientUserIds: adminsAndStaff.map((user) => user.id),
    };
  });
}

export async function abortDocumentFileReservation(storedFileId: string) {
  return prisma.storedFile.delete({ where: { id: storedFileId } });
}

export async function createDocumentUploadTransaction(data: {
  docId: string;
  storedFileId: string;
  ownerId: string;
  documentTypeId: string;
  buildFile: (sequence: number) => PreparedDocumentFile;
  uploadFile: (uploadPath: string) => Promise<string>;
  fileSize: bigint;
  mimeType: string;
  fileHash: string;
  storageProvider: StorageProviderValue;
  uploadedBy: string;
  title: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  createdBy: string;
  replacesDocumentId: string | null;
  allowMultiple?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    await lockDocumentSequence(tx, data.ownerId, data.documentTypeId);

    const existingCount = await tx.documentRecord.count({
      where: { ownerId: data.ownerId, documentTypeId: data.documentTypeId },
    });
    const { fileName, uploadPath } = data.buildFile(existingCount + 1);

    let storedFile = await tx.storedFile.create({
      data: {
        id: data.storedFileId,
        fileName,
        filePath: uploadPath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        fileHash: data.fileHash,
        storageProvider: data.storageProvider,
        uploadedBy: data.uploadedBy,
      },
    });

    const savedPath = await data.uploadFile(uploadPath);
    if (savedPath !== uploadPath) {
      storedFile = await tx.storedFile.update({
        where: { id: data.storedFileId },
        data: { filePath: savedPath },
      });
    }

    const replacedDocuments: ReplacedDocumentSnapshot[] = data.replacesDocumentId
      ? await tx.documentRecord.findMany({
          where: { id: data.replacesDocumentId, deletedAt: null, isCurrent: true },
          select: { id: true, status: true },
        })
      : data.allowMultiple
        ? []
        : await tx.documentRecord.findMany({
            where: {
              ownerId: data.ownerId,
              documentTypeId: data.documentTypeId,
              deletedAt: null,
              isCurrent: true,
            },
            select: { id: true, status: true },
          });

    const documentRecord = await tx.documentRecord.create({
      data: {
        id: data.docId,
        ownerId: data.ownerId,
        documentTypeId: data.documentTypeId,
        storedFileId: data.storedFileId,
        replacesDocumentId: data.replacesDocumentId,
        title: data.title,
        status: "PENDING",
        isCurrent: true,
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        createdBy: data.createdBy,
      },
    });

    if (documentRecord.status === "PENDING") {
      await tx.verificationHistory.create({
        data: {
          id: crypto.randomUUID(),
          documentRecordId: data.docId,
          status: "PENDING",
          reviewNote: data.replacesDocumentId
            ? "Sistem: File dokumen diganti dan menunggu verifikasi ulang."
            : "Sistem: Menunggu verifikasi dokumen baru.",
        },
      });
    }

    const adminsAndStaff = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] }, isActive: true, deletedAt: null },
      select: { id: true },
    });

    return {
      record: withStoredFileMetadata({ ...documentRecord, storedFile }),
      replacedDocuments,
      verificationRecipientUserIds: adminsAndStaff.map((user) => user.id),
    };
  });
}

export async function findDocumentRecordWithOwner(id: string) {
  const record = await prisma.documentRecord.findUnique({
    where: { id, deletedAt: null },
    include: { owner: true, storedFile: true },
  });

  return record ? withStoredFileMetadata(record) : null;
}

export async function findDocumentRecordWithOwnerAndDocumentType(id: string) {
  const record = await prisma.documentRecord.findUnique({
    where: { id, deletedAt: null },
    include: {
      storedFile: true,
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

  return record ? withStoredFileMetadata(record) : null;
}
