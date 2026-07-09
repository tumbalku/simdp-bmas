/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import path from "path";
import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/service";
import { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export async function handleDocumentTypeCrud(
  operation: "CREATE" | "UPDATE" | "DELETE" | "RESTORE",
  id?: string,
  data?: any,
  actorId?: string,
  actorName?: string,
  actorRole?: string
) {
  const systemActor = {
    actorId: actorId || null,
    actorName: actorName || "System",
    actorRole: actorRole || "ADMIN",
  };

  if (operation === "CREATE") {
    if (!data.code || !data.name || !data.archiveCategory || !data.allowedFormats || !data.maxSizeMb) {
      throw new Error("Field wajib DocumentType tidak boleh kosong");
    }

    const typeId = crypto.randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const docType = await tx.documentType.create({
        data: {
          id: typeId,
          code: data.code,
          name: data.name,
          description: data.description || null,
          archiveCategory: data.archiveCategory,
          isMandatory: data.isMandatory ?? false,
          allowMultiple: data.allowMultiple ?? false,
          requiresExpiryDate: data.requiresExpiryDate ?? false,
          requiresIssueDate: data.requiresIssueDate ?? false,
          requiresDocumentNumber: data.requiresDocumentNumber ?? false,
          allowedFormats: data.allowedFormats,
          maxSizeMb: parseFloat(data.maxSizeMb),
          createdBy: systemActor.actorId,
        },
      });

      // Target relations
      if (data.professionGroupIds?.length) {
        await tx.documentTypeProfessionGroup.createMany({
          data: data.professionGroupIds.map((pgId: string) => ({
            id: crypto.randomUUID(),
            documentTypeId: typeId,
            professionGroupId: pgId,
          })),
        });
      }
      if (data.employmentStatusIds?.length) {
        await tx.documentTypeEmploymentStatus.createMany({
          data: data.employmentStatusIds.map((esId: string) => ({
            id: crypto.randomUUID(),
            documentTypeId: typeId,
            employmentStatusId: esId,
          })),
        });
      }
      if (data.employeeGroupIds?.length) {
        await tx.documentTypeEmployeeGroup.createMany({
          data: data.employeeGroupIds.map((egId: string) => ({
            id: crypto.randomUUID(),
            documentTypeId: typeId,
            employeeGroupId: egId,
          })),
        });
      }
      if (data.employeeRankIds?.length) {
        await tx.documentTypeEmployeeRank.createMany({
          data: data.employeeRankIds.map((erId: string) => ({
            id: crypto.randomUUID(),
            documentTypeId: typeId,
            employeeRankId: erId,
          })),
        });
      }
      if (data.workplaceIds?.length) {
        await tx.documentTypeWorkplace.createMany({
          data: data.workplaceIds.map((wpId: string) => ({
            id: crypto.randomUUID(),
            documentTypeId: typeId,
            workplaceId: wpId,
          })),
        });
      }

      return docType;
    });

    await logActivity({
      ...systemActor,
      eventType: "MASTER_DATA_CREATED",
      resource: `DocumentType:${typeId}`,
      status: "SUCCESS",
      metadata: { code: result.code, name: result.name },
    });

    return { id: result.id, code: result.code, name: result.name };
  }

  if (operation === "UPDATE") {
    if (!id) throw new Error("ID jenis dokumen wajib diisi");

    const docType = await prisma.documentType.findUnique({
      where: { id },
    });

    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentType.update({
        where: { id },
        data: {
          code: data.code ?? undefined,
          name: data.name ?? undefined,
          description: data.description !== undefined ? data.description : undefined,
          archiveCategory: data.archiveCategory ?? undefined,
          isMandatory: data.isMandatory ?? undefined,
          allowMultiple: data.allowMultiple ?? undefined,
          requiresExpiryDate: data.requiresExpiryDate ?? undefined,
          requiresIssueDate: data.requiresIssueDate ?? undefined,
          requiresDocumentNumber: data.requiresDocumentNumber ?? undefined,
          allowedFormats: data.allowedFormats ?? undefined,
          maxSizeMb: data.maxSizeMb ? parseFloat(data.maxSizeMb) : undefined,
          updatedBy: systemActor.actorId,
          updatedAt: new Date(),
        },
      });

      // Re-sync relations if provided
      if (data.professionGroupIds !== undefined) {
        await tx.documentTypeProfessionGroup.deleteMany({ where: { documentTypeId: id } });
        if (data.professionGroupIds.length) {
          await tx.documentTypeProfessionGroup.createMany({
            data: data.professionGroupIds.map((pgId: string) => ({
              id: crypto.randomUUID(),
              documentTypeId: id,
              professionGroupId: pgId,
            })),
          });
        }
      }

      if (data.employmentStatusIds !== undefined) {
        await tx.documentTypeEmploymentStatus.deleteMany({ where: { documentTypeId: id } });
        if (data.employmentStatusIds.length) {
          await tx.documentTypeEmploymentStatus.createMany({
            data: data.employmentStatusIds.map((esId: string) => ({
              id: crypto.randomUUID(),
              documentTypeId: id,
              employmentStatusId: esId,
            })),
          });
        }
      }

      if (data.employeeGroupIds !== undefined) {
        await tx.documentTypeEmployeeGroup.deleteMany({ where: { documentTypeId: id } });
        if (data.employeeGroupIds.length) {
          await tx.documentTypeEmployeeGroup.createMany({
            data: data.employeeGroupIds.map((egId: string) => ({
              id: crypto.randomUUID(),
              documentTypeId: id,
              employeeGroupId: egId,
            })),
          });
        }
      }

      if (data.employeeRankIds !== undefined) {
        await tx.documentTypeEmployeeRank.deleteMany({ where: { documentTypeId: id } });
        if (data.employeeRankIds.length) {
          await tx.documentTypeEmployeeRank.createMany({
            data: data.employeeRankIds.map((erId: string) => ({
              id: crypto.randomUUID(),
              documentTypeId: id,
              employeeRankId: erId,
            })),
          });
        }
      }

      if (data.workplaceIds !== undefined) {
        await tx.documentTypeWorkplace.deleteMany({ where: { documentTypeId: id } });
        if (data.workplaceIds.length) {
          await tx.documentTypeWorkplace.createMany({
            data: data.workplaceIds.map((wpId: string) => ({
              id: crypto.randomUUID(),
              documentTypeId: id,
              workplaceId: wpId,
            })),
          });
        }
      }

      return updated;
    });

    await logActivity({
      ...systemActor,
      eventType: "MASTER_DATA_UPDATED",
      resource: `DocumentType:${id}`,
      status: "SUCCESS",
      metadata: { code: result.code, name: result.name },
    });

    return { id: result.id, code: result.code, name: result.name };
  }

  if (operation === "DELETE") {
    if (!id) throw new Error("ID jenis dokumen wajib diisi");

    const docType = await prisma.documentType.findUnique({
      where: { id },
    });

    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    await prisma.documentType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      ...systemActor,
      eventType: "MASTER_DATA_DELETED",
      resource: `DocumentType:${id}`,
      status: "SUCCESS",
    });

    return { id, code: docType.code, name: docType.name };
  }

  if (operation === "RESTORE") {
    if (!id) throw new Error("ID jenis dokumen wajib diisi");

    const docType = await prisma.documentType.findUnique({
      where: { id },
    });

    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    await prisma.documentType.update({
      where: { id },
      data: { deletedAt: null },
    });

    await logActivity({
      ...systemActor,
      eventType: "MASTER_DATA_UPDATED",
      resource: `DocumentType:${id}`,
      status: "SUCCESS",
      metadata: { action: "restore" },
    });

    return { id, code: docType.code, name: docType.name };
  }

  throw new Error("Operasi tidak didukung");
}

function validateFileFormat(buffer: Buffer, allowedFormatsStr: string): string {
  const allowed = allowedFormatsStr.toLowerCase().split(",").map((f) => f.trim());
  const header = buffer.subarray(0, 4).toString("hex").toUpperCase();

  let detectedExt = "";
  if (header.startsWith("25504446")) {
    detectedExt = "pdf";
  } else if (header.startsWith("89504E47")) {
    detectedExt = "png";
  } else if (header.startsWith("FFD8FF")) {
    detectedExt = "jpg";
  }

  if (!detectedExt) {
    throw new AppError("UNSUPPORTED_MEDIA_TYPE", "Format file tidak dikenal atau tidak didukung", 415);
  }

  const isAllowed =
    allowed.includes(detectedExt) ||
    (detectedExt === "jpg" && allowed.includes("jpeg")) ||
    (detectedExt === "jpeg" && allowed.includes("jpg"));

  if (!isAllowed) {
    throw new AppError("UNSUPPORTED_MEDIA_TYPE", `Format file .${detectedExt} tidak diizinkan. Yang diizinkan: ${allowedFormatsStr}`, 415);
  }

  return detectedExt;
}

export async function uploadDocumentRecord(
  data: {
    documentTypeId: string;
    file: File;
    title?: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
  },
  session: TokenPayload,
  ipAddress?: string | null
) {
  // 1. Fetch document type rules
  const docType = await prisma.documentType.findUnique({
    where: { id: data.documentTypeId, deletedAt: null },
  });

  if (!docType) throw new AppError("VALIDATION_ERROR", "Jenis dokumen tidak ditemukan atau tidak aktif", 400);

  // 2. Fetch current employee
  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId, deletedAt: null },
  });

  if (!employee) throw new AppError("VALIDATION_ERROR", "Data pegawai tidak ditemukan", 400);

  // 3. Validate conditional fields
  if (docType.requiresDocumentNumber && !data.documentNumber) {
    throw new AppError("VALIDATION_ERROR", "Nomor dokumen wajib diisi untuk jenis dokumen ini.", 400);
  }
  if (docType.requiresIssueDate && !data.issueDate) {
    throw new AppError("VALIDATION_ERROR", "Tanggal terbit wajib diisi untuk jenis dokumen ini.", 400);
  }
  if (docType.requiresExpiryDate && !data.expiryDate) {
    throw new AppError("VALIDATION_ERROR", "Tanggal kedaluwarsa wajib diisi untuk jenis dokumen ini.", 400);
  }

  // 4. File Buffer & Content check
  const fileArrayBuffer = await data.file.arrayBuffer();
  const buffer = Buffer.from(fileArrayBuffer);

  // Validate size
  const sizeMb = buffer.length / (1024 * 1024);
  if (sizeMb > docType.maxSizeMb) {
    throw new AppError("PAYLOAD_TOO_LARGE", `Ukuran file melebihi batas maksimal ${docType.maxSizeMb} MB.`, 413);
  }

  // Validate magic bytes
  const ext = validateFileFormat(buffer, docType.allowedFormats);

  // Calculate SHA-256 hash
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // 5. Sequence count for unique name
  const existingCount = await prisma.documentRecord.count({
    where: { ownerId: employee.id, documentTypeId: docType.id },
  });
  const sequence = existingCount + 1;

  // File path format: {KODE-DOKUMEN}/{KODE-DOKUMEN}-{URUTAN}-{IDENTIFIER}.{ext}
  const identifier = employee.employeeId || employee.nik || session.userId;
  const fileName = `${docType.code}-${sequence}-${identifier}.${ext}`;
  const uploadPath = path.join(docType.code, fileName).replace(/\\/g, "/");

  // 6. Upload via storage provider
  const savedPath = await storage.upload(uploadPath, buffer, data.file.type);

  // 7. Write record to DB
  const docId = crypto.randomUUID();
  const replacedDocumentIds: string[] = [];

  const record = await prisma.$transaction(async (tx) => {
    // If allowMultiple is false, replace active document of same type
    if (!docType.allowMultiple) {
      const activeDocs = await tx.documentRecord.findMany({
        where: { ownerId: employee.id, documentTypeId: docType.id, isCurrent: true, deletedAt: null },
      });

      if (activeDocs.length > 0) {
        await tx.documentRecord.updateMany({
          where: { ownerId: employee.id, documentTypeId: docType.id, isCurrent: true },
          data: { isCurrent: false, status: "REPLACED" },
        });

        replacedDocumentIds.push(...activeDocs.map((doc) => doc.id));
      }
    }

    const docRec = await tx.documentRecord.create({
      data: {
        id: docId,
        ownerId: employee.id,
        documentTypeId: docType.id,
        title: data.title || docType.name,
        status: "PENDING",
        isCurrent: true,
        allowMultipleSnapshot: docType.allowMultiple,
        fileName,
        filePath: savedPath,
        fileSize: BigInt(buffer.length),
        mimeType: data.file.type || null,
        fileHash,
        storageProvider: "local",
        documentNumber: data.documentNumber || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        createdBy: session.userId,
      },
    });

    // Create VerificationHistory pending baseline
    await tx.verificationHistory.create({
      data: {
        id: crypto.randomUUID(),
        documentRecordId: docId,
        status: "PENDING",
        reviewNote: "Sistem: Menunggu verifikasi dokumen baru.",
      },
    });

    // Create Notification for admin/staff
    // Find all users with STAFF/ADMIN roles to notify
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
        message: `Pegawai ${employee.name} telah mengunggah dokumen baru: ${docType.name}`,
        relatedEntityType: "DocumentRecord",
        relatedEntityId: docId,
      })),
    });

    return docRec;
  });

  for (const replacedDocumentId of replacedDocumentIds) {
    await logActivity({
      actorId: session.userId,
      actorName: employee.name,
      actorRole: session.role,
      eventType: "DOCUMENT_DELETED",
      resource: `DocumentRecord:${replacedDocumentId}`,
      status: "SUCCESS",
      metadata: { reason: "replaced_by_new_upload" },
    });
  }

  await logActivity({
    actorId: session.userId,
    actorName: employee.name,
    actorRole: session.role,
    eventType: "DOCUMENT_UPLOADED",
    resource: `DocumentRecord:${docId}`,
    ipAddress,
    status: "SUCCESS",
    metadata: { fileName, documentTypeId: docType.id },
  });

  return {
    id: record.id,
    status: record.status,
    fileName: record.fileName,
    filePath: record.filePath,
  };
}

export async function generateDownloadUrl(documentId: string, session: TokenPayload) {
  const doc = await prisma.documentRecord.findUnique({
    where: { id: documentId, deletedAt: null },
    include: {
      owner: true,
    },
  });

  if (!doc) throw new AppError("NOT_FOUND", "Dokumen tidak ditemukan atau terhapus", 404);

  // Enforce ownership for non-staff
  if (session.role === "EMPLOYEE") {
    if (doc.owner.userId !== session.userId) {
      await logActivity({
        actorId: session.userId,
        actorName: doc.owner.name,
        actorRole: session.role,
        eventType: "DOCUMENT_DOWNLOADED",
        resource: `DocumentRecord:${documentId}`,
        status: "FAILED",
        metadata: { reason: "OWNERSHIP_REQUIRED" },
      });
      throw new AppError("OWNERSHIP_REQUIRED", "OWNERSHIP_REQUIRED", 403);
    }
  }

  const downloadUrl = await storage.getTemporaryUrl(doc.filePath);

  await logActivity({
    actorId: session.userId,
    actorName: doc.owner.name,
    actorRole: session.role,
    eventType: "DOCUMENT_DOWNLOADED",
    resource: `DocumentRecord:${documentId}`,
    status: "SUCCESS",
  });

  return downloadUrl;
}

export async function getLocalStreamDocument(filePath: string, session: TokenPayload) {
  const doc = await prisma.documentRecord.findFirst({
    where: {
      filePath: `uploads/${filePath}`,
      deletedAt: null,
    },
    include: {
      owner: true,
    },
  });

  if (!doc) throw new Error("Dokumen tidak ditemukan atau terhapus");

  if (session.role === "EMPLOYEE" && doc.owner.userId !== session.userId) {
    throw new Error("OWNERSHIP_REQUIRED");
  }

  return {
    fileName: doc.fileName,
    mimeType: doc.mimeType,
  };
}

export async function softDeleteDocument(documentId: string, session: TokenPayload) {
  const doc = await prisma.documentRecord.findUnique({
    where: { id: documentId, deletedAt: null },
    include: {
      owner: true,
    },
  });

  if (!doc) throw new Error("Dokumen tidak ditemukan");

  // Ownership check
  if (session.role === "EMPLOYEE") {
    if (doc.owner.userId !== session.userId) {
      throw new Error("OWNERSHIP_REQUIRED");
    }
    // Employee can delete only if PENDING or REJECTED
    if (doc.status !== "PENDING" && doc.status !== "REJECTED") {
      throw new Error("Pegawai tidak dapat menghapus dokumen yang sudah disetujui (APPROVED).");
    }
  }

  await prisma.documentRecord.update({
    where: { id: documentId },
    data: {
      deletedAt: new Date(),
      isCurrent: false,
    },
  });

  await logActivity({
    actorId: session.userId,
    actorName: doc.owner.name,
    actorRole: session.role,
    eventType: "DOCUMENT_DELETED",
    resource: `DocumentRecord:${documentId}`,
    status: "SUCCESS",
  });

  return true;
}

export async function restoreDocument(documentId: string, session: TokenPayload) {
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  const doc = await prisma.documentRecord.findUnique({
    where: { id: documentId },
    include: {
      owner: true,
    },
  });

  if (!doc) throw new Error("Dokumen tidak ditemukan");

  await prisma.documentRecord.update({
    where: { id: documentId },
    data: {
      deletedAt: null,
      isCurrent: true,
    },
  });

  await logActivity({
    actorId: session.userId,
    actorName: doc.owner.name,
    actorRole: session.role,
    eventType: "DOCUMENT_RESTORED",
    resource: `DocumentRecord:${documentId}`,
    status: "SUCCESS",
  });

  return true;
}

export async function processExpiredDocumentsAndReminders() {
  const now = new Date();

  // 1. Expired Transition: APPROVED documents whose expiryDate <= now
  const expiredDocs = await prisma.documentRecord.findMany({
    where: {
      status: "APPROVED",
      deletedAt: null,
      expiryDate: { lte: now },
    },
    include: { owner: true, documentType: true },
  });

  let expiredCount = 0;
  for (const doc of expiredDocs) {
    await prisma.documentRecord.update({
      where: { id: doc.id },
      data: { status: "EXPIRED" },
    });

    await logActivity({
      actorName: "System",
      actorRole: "System",
      eventType: "CRON_DOCUMENT_EXPIRED",
      resource: `DocumentRecord:${doc.id}`,
      status: "SUCCESS",
      metadata: { code: doc.documentType.code, ownerId: doc.ownerId },
    });

    expiredCount++;
  }

  // 2. Idempotent Reminders
  // Load configurations
  const settings = await prisma.systemSetting.findMany();
  const getSettingVal = (key: string, fallback: number) => {
    const s = settings.find((x) => x.key === key);
    return s ? parseInt(s.value, 10) : fallback;
  };

  const reminderDaysH30 = getSettingVal("reminder_days_h30", 30);
  const reminderDaysH7 = getSettingVal("reminder_days_h7", 7);
  const reminderDaysH1 = getSettingVal("reminder_days_h1", 1);

  // UTC midnight helper
  const getMidnightUTC = (offsetDays: number) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d;
  };

  const h30Date = getMidnightUTC(reminderDaysH30);
  const h7Date = getMidnightUTC(reminderDaysH7);
  const h1Date = getMidnightUTC(reminderDaysH1);

  // Find all APPROVED docs with expiryDate matching target dates and flags are null
  const docsToRemind = await prisma.documentRecord.findMany({
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

  const remindersSent = {
    H30: 0,
    H7: 0,
    H1: 0,
  };

  const dateString = (d: Date) => d.toISOString().split("T")[0];

  for (const doc of docsToRemind) {
    if (!doc.expiryDate) continue;
    const docTime = doc.expiryDate.getTime();

    if (docTime === h30Date.getTime() && !doc.reminderH30SentAt) {
      await prisma.$transaction([
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: doc.owner.userId,
            type: "EXPIRY_REMINDER",
            title: "Peringatan Kedaluwarsa Dokumen (H-30)",
            message: `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa dalam 30 hari (${dateString(
              doc.expiryDate
            )}).`,
            relatedEntityType: "DocumentRecord",
            relatedEntityId: doc.id,
          },
        }),
        prisma.documentRecord.update({
          where: { id: doc.id },
          data: { reminderH30SentAt: new Date() },
        }),
      ]);
      remindersSent.H30++;
    } else if (docTime === h7Date.getTime() && !doc.reminderH7SentAt) {
      await prisma.$transaction([
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: doc.owner.userId,
            type: "EXPIRY_REMINDER",
            title: "Peringatan Kedaluwarsa Dokumen (H-7)",
            message: `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa dalam 7 hari (${dateString(
              doc.expiryDate
            )}).`,
            relatedEntityType: "DocumentRecord",
            relatedEntityId: doc.id,
          },
        }),
        prisma.documentRecord.update({
          where: { id: doc.id },
          data: { reminderH7SentAt: new Date() },
        }),
      ]);
      remindersSent.H7++;
    } else if (docTime === h1Date.getTime() && !doc.reminderH1SentAt) {
      await prisma.$transaction([
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: doc.owner.userId,
            type: "EXPIRY_REMINDER",
            title: "Peringatan Kedaluwarsa Dokumen (H-1)",
            message: `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa besok (${dateString(
              doc.expiryDate
            )}).`,
            relatedEntityType: "DocumentRecord",
            relatedEntityId: doc.id,
          },
        }),
        prisma.documentRecord.update({
          where: { id: doc.id },
          data: { reminderH1SentAt: new Date() },
        }),
      ]);
      remindersSent.H1++;
    }
  }

  await logActivity({
    actorName: "System",
    actorRole: "System",
    eventType: "CRON_CHECK_EXPIRY_RUN",
    resource: "CronCheckExpiry",
    status: "SUCCESS",
    metadata: { expiredCount, remindersSent },
  });

  return {
    expiredCount,
    remindersSent,
  };
}

