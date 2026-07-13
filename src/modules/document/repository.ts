/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function findManyAvailableDocumentTypes() {
  return prisma.documentType.findMany({
    where: { deletedAt: null },
    orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
  });
}

export async function findEmployeeByUserId(userId: string) {
  return prisma.employee.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true, userId: true },
  });
}

export async function findEmployeeByUserIdUnique(userId: string) {
  return prisma.employee.findUnique({
    where: { userId, deletedAt: null } as any,
  });
}

export async function findDocumentRecords(where: any) {
  return prisma.documentRecord.findMany({
    where,
    include: {
      documentType: { select: { id: true, name: true, archiveCategory: true } },
      owner: { select: { id: true, name: true, employeeId: true, nik: true } },
    },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function findDocumentRecordsWithPagination(where: any, skip: number, limit: number) {
  return Promise.all([
    prisma.documentRecord.findMany({
      where,
      include: {
        documentType: { select: { id: true, name: true, archiveCategory: true } },
        owner: { select: { id: true, name: true, employeeId: true, nik: true } },
      },
      orderBy: { uploadedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.documentRecord.count({ where }),
  ]);
}

export async function findDocumentRecordDetailById(documentId: string) {
  return prisma.documentRecord.findUnique({
    where: { id: documentId, deletedAt: null },
    include: {
      documentType: { select: { id: true, name: true, archiveCategory: true, code: true, description: true } },
      owner: { select: { id: true, userId: true, name: true, employeeId: true, nik: true } },
      verificationHistories: {
        orderBy: { reviewedAt: "desc" },
        include: { reviewedBy: { select: { email: true, employee: { select: { name: true } } } } },
      },
    },
  });
}

export async function findDocumentTypeById(id: string) {
  return prisma.documentType.findUnique({
    where: { id },
  });
}

export async function createDocumentTypeWithRelations(
  id: string,
  insertData: any,
  relationIds: {
    professionGroupIds?: string[];
    employmentStatusIds?: string[];
    employeeGroupIds?: string[];
    employeeRankIds?: string[];
    workplaceIds?: string[];
  }
) {
  return prisma.$transaction(async (tx) => {
    const docType = await tx.documentType.create({
      data: insertData,
    });

    if (relationIds.professionGroupIds?.length) {
      await tx.documentTypeProfessionGroup.createMany({
        data: relationIds.professionGroupIds.map((pgId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          professionGroupId: pgId,
        })),
      });
    }
    if (relationIds.employmentStatusIds?.length) {
      await tx.documentTypeEmploymentStatus.createMany({
        data: relationIds.employmentStatusIds.map((esId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          employmentStatusId: esId,
        })),
      });
    }
    if (relationIds.employeeGroupIds?.length) {
      await tx.documentTypeEmployeeGroup.createMany({
        data: relationIds.employeeGroupIds.map((egId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          employeeGroupId: egId,
        })),
      });
    }
    if (relationIds.employeeRankIds?.length) {
      await tx.documentTypeEmployeeRank.createMany({
        data: relationIds.employeeRankIds.map((erId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          employeeRankId: erId,
        })),
      });
    }
    if (relationIds.workplaceIds?.length) {
      await tx.documentTypeWorkplace.createMany({
        data: relationIds.workplaceIds.map((wpId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          workplaceId: wpId,
        })),
      });
    }

    return docType;
  });
}

export async function updateDocumentTypeWithRelations(
  id: string,
  updateData: any,
  relationIds: {
    professionGroupIds?: string[];
    employmentStatusIds?: string[];
    employeeGroupIds?: string[];
    employeeRankIds?: string[];
    workplaceIds?: string[];
  }
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.documentType.update({
      where: { id },
      data: updateData,
    });

    if (relationIds.professionGroupIds !== undefined) {
      await tx.documentTypeProfessionGroup.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.professionGroupIds.length) {
        await tx.documentTypeProfessionGroup.createMany({
          data: relationIds.professionGroupIds.map((pgId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            professionGroupId: pgId,
          })),
        });
      }
    }

    if (relationIds.employmentStatusIds !== undefined) {
      await tx.documentTypeEmploymentStatus.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.employmentStatusIds.length) {
        await tx.documentTypeEmploymentStatus.createMany({
          data: relationIds.employmentStatusIds.map((esId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            employmentStatusId: esId,
          })),
        });
      }
    }

    if (relationIds.employeeGroupIds !== undefined) {
      await tx.documentTypeEmployeeGroup.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.employeeGroupIds.length) {
        await tx.documentTypeEmployeeGroup.createMany({
          data: relationIds.employeeGroupIds.map((egId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            employeeGroupId: egId,
          })),
        });
      }
    }

    if (relationIds.employeeRankIds !== undefined) {
      await tx.documentTypeEmployeeRank.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.employeeRankIds.length) {
        await tx.documentTypeEmployeeRank.createMany({
          data: relationIds.employeeRankIds.map((erId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            employeeRankId: erId,
          })),
        });
      }
    }

    if (relationIds.workplaceIds !== undefined) {
      await tx.documentTypeWorkplace.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.workplaceIds.length) {
        await tx.documentTypeWorkplace.createMany({
          data: relationIds.workplaceIds.map((wpId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            workplaceId: wpId,
          })),
        });
      }
    }

    return updated;
  });
}

export async function softDeleteDocumentType(id: string) {
  return prisma.documentType.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreDocumentType(id: string) {
  return prisma.documentType.update({
    where: { id },
    data: { deletedAt: null },
  });
}

export async function countDocumentRecords(ownerId: string, documentTypeId: string) {
  return prisma.documentRecord.count({
    where: { ownerId, documentTypeId },
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
  storageProvider: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  createdBy: string;
  allowMultiple: boolean;
  documentTypeName: string;
  ownerName: string;
}) {
  const replacedDocumentIds: string[] = [];
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

    await tx.notification.createMany({
      data: adminsAndStaff.map((u) => ({
        id: crypto.randomUUID(),
        userId: u.id,
        type: "VERIFICATION_REQUIRED",
        title: "Dokumen Baru Perlu Verifikasi",
        message: `Pegawai ${data.ownerName} telah mengunggah dokumen baru: ${data.documentTypeName}`,
        relatedEntityType: "DocumentRecord",
        relatedEntityId: data.docId,
      })),
    });

    return docRec;
  });

  return { record, replacedDocumentIds };
}

export async function findDocumentRecordWithOwner(id: string) {
  return prisma.documentRecord.findUnique({
    where: { id, deletedAt: null },
    include: { owner: true },
  });
}

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
    include: { owner: true },
  });
}

export async function restoreDocumentRecord(id: string) {
  return prisma.documentRecord.update({
    where: { id },
    data: {
      deletedAt: null,
      isCurrent: true,
    },
  });
}

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
        type: "EXPIRY_REMINDER",
        title: data.title,
        message: data.message,
        relatedEntityType: "DocumentRecord",
        relatedEntityId: data.relatedEntityId,
      },
    }),
    prisma.documentRecord.update({
      where: { id: data.documentRecordId },
      data: { [data.reminderField]: new Date() },
    }),
  ]);
}
