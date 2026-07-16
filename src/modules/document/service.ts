/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import path from "path";
import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/service";
import { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { mapDocumentRecord, mapDocumentType, mapDocumentDetail, mapDocumentTypeFormInitialData, mapDocumentTypeSummary } from "./mappers";
import * as repo from "./repository";
import { matchesDocumentTypeTarget } from "./target-rules";

type DocumentListFilter = {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED";
  search?: string;
  page?: number;
  limit?: number;
};

type DocumentTypeListFilter = {
  archiveCategory?: "PERSONAL" | "EDUCATION" | "EMPLOYMENT" | "CERTIFICATION" | "LEGAL";
  search?: string;
  page?: number;
  limit?: number;
};

export async function getAvailableDocumentTypes(session?: TokenPayload) {
  const types = await repo.findManyAvailableDocumentTypes();

  if (!session || session.role !== "EMPLOYEE") {
    return types.map(mapDocumentType);
  }

  const employee = await repo.findEmployeeTargetProfileByUserId(session.userId);
  if (!employee) return [];

  return types
    .filter((type) => matchesDocumentTypeTarget(employee, type))
    .map(mapDocumentType);
}

export async function getDocumentTypesWithPagination(filter: DocumentTypeListFilter = {}) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  if (filter.archiveCategory) {
    where.archiveCategory = filter.archiveCategory;
  }

  if (filter.search) {
    where.OR = [
      { code: { contains: filter.search, mode: "insensitive" } },
      { name: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [types, total] = await repo.findDocumentTypesWithPagination(where, skip, limit);

  return {
    data: types.map(mapDocumentTypeSummary),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDocumentTypeForAdminEdit(id: string) {
  const docType = await repo.findDocumentTypeById(id);

  if (!docType || docType.deletedAt) {
    throw new AppError("NOT_FOUND", "Jenis dokumen tidak ditemukan", 404);
  }

  return mapDocumentTypeFormInitialData(docType);
}

export async function getDocumentRecordsForSession(session: TokenPayload, filter: DocumentListFilter = {}) {
  const where: any = { deletedAt: null };

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { fileName: { contains: filter.search, mode: "insensitive" } },
      { documentType: { name: { contains: filter.search, mode: "insensitive" } } },
      { owner: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  if (session.role === "EMPLOYEE") {
    const employee = await repo.findEmployeeByUserId(session.userId);
    if (!employee) return [];
    where.ownerId = employee.id;
  }

  const records = await repo.findDocumentRecords(where);
  return records.map(mapDocumentRecord);
}

export async function getDocumentRecordsWithPagination(
  filter: DocumentListFilter & { page?: number; limit?: number } = {}
) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { fileName: { contains: filter.search, mode: "insensitive" } },
      { documentType: { name: { contains: filter.search, mode: "insensitive" } } },
      { owner: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const [records, total] = await repo.findDocumentRecordsWithPagination(where, skip, limit);

  return {
    data: records.map(mapDocumentRecord),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDocumentRecordDetailForSession(documentId: string, session: TokenPayload) {
  const record = await repo.findDocumentRecordDetailById(documentId);

  if (!record) throw new AppError("NOT_FOUND", "Dokumen tidak ditemukan", 404);
  if (session.role === "EMPLOYEE" && record.owner.userId !== session.userId) {
    throw new AppError("OWNERSHIP_REQUIRED", "OWNERSHIP_REQUIRED", 403);
  }

  return mapDocumentDetail(record);
}

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
    const insertData = {
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
    };

    const relationIds = {
      professionGroupIds: data.professionGroupIds,
      employmentStatusIds: data.employmentStatusIds,
      employeeGroupIds: data.employeeGroupIds,
      employeePositionIds: data.employeePositionIds,
      employeeRankIds: data.employeeRankIds,
      workplaceIds: data.workplaceIds,
    };

    const result = await repo.createDocumentTypeWithRelations(typeId, insertData, relationIds);

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

    const docType = await repo.findDocumentTypeById(id);
    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    const updateData = {
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
    };

    const relationIds = {
      professionGroupIds: data.professionGroupIds,
      employmentStatusIds: data.employmentStatusIds,
      employeeGroupIds: data.employeeGroupIds,
      employeePositionIds: data.employeePositionIds,
      employeeRankIds: data.employeeRankIds,
      workplaceIds: data.workplaceIds,
    };

    const result = await repo.updateDocumentTypeWithRelations(id, updateData, relationIds);

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

    const docType = await repo.findDocumentTypeById(id);
    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    await repo.softDeleteDocumentType(id);

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

    const docType = await repo.findDocumentTypeById(id);
    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    await repo.restoreDocumentType(id);

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
  const docType = await repo.findDocumentTypeById(data.documentTypeId);
  if (!docType || docType.deletedAt) {
    throw new AppError("VALIDATION_ERROR", "Jenis dokumen tidak ditemukan atau tidak aktif", 400);
  }

  // 2. Fetch current employee
  const employee = await repo.findEmployeeTargetProfileByUserId(session.userId);
  if (!employee) throw new AppError("VALIDATION_ERROR", "Data pegawai tidak ditemukan", 400);

  if (!matchesDocumentTypeTarget(employee, docType)) {
    throw new AppError("FORBIDDEN", "Jenis dokumen ini tidak berlaku untuk data kepegawaian Anda.", 403);
  }

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
  const existingCount = await repo.countDocumentRecords(employee.id, docType.id);
  const sequence = existingCount + 1;

  // File path format: {KODE-DOKUMEN}/{KODE-DOKUMEN}-{URUTAN}-{IDENTIFIER}.{ext}
  const identifier = employee.employeeId || employee.nik || session.userId;
  const fileName = `${docType.code}-${sequence}-${identifier}.${ext}`;
  const uploadPath = path.join(docType.code, fileName).replace(/\\/g, "/");

  // 6. Upload via storage provider
  const savedPath = await storage.upload(uploadPath, buffer, data.file.type);

  // 7. Write record to DB
  const docId = crypto.randomUUID();

  const { record, replacedDocumentIds } = await repo.createUploadedDocumentTransaction({
    docId,
    ownerId: employee.id,
    documentTypeId: docType.id,
    title: data.title || docType.name,
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
    allowMultiple: docType.allowMultiple,
    documentTypeName: docType.name,
    ownerName: employee.name,
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
  const doc = await repo.findDocumentRecordWithOwner(documentId);

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
  const doc = await repo.findDocumentRecordByFilePath(`uploads/${filePath}`);

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
  const doc = await repo.findDocumentRecordWithOwner(documentId);

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

  await repo.softDeleteDocumentRecord(documentId);

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

  const doc = await repo.findDocumentRecordWithDeletedWithOwner(documentId);

  if (!doc) throw new Error("Dokumen tidak ditemukan");

  await repo.restoreDocumentRecord(documentId);

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
  const expiredDocs = await repo.findExpiredApprovedDocuments(now);

  let expiredCount = 0;
  for (const doc of expiredDocs) {
    await repo.updateDocumentStatus(doc.id, "EXPIRED");

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
  const settings = await repo.findSystemSettings();
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
  const docsToRemind = await repo.findDocumentsToRemind(h30Date, h7Date, h1Date);

  const remindersSent = {
    H30: 0,
    H7: 0,
    H1: 0,
  };

  const dateString = (d: Date) => d.toISOString().split("T")[0];

  for (const doc of docsToRemind) {
    if (!doc.expiryDate) continue;
    const docTime = doc.expiryDate.getTime();

    const { enqueueNotificationDispatch } = await import("@/modules/notification/service");

    if (docTime === h30Date.getTime() && !doc.reminderH30SentAt) {
      const notificationId = crypto.randomUUID();
      await repo.createNotificationAndUpdateReminder({
        notificationId,
        userId: doc.owner.userId,
        title: "Peringatan Kedaluwarsa Dokumen (H-30)",
        message: `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa dalam 30 hari (${dateString(
          doc.expiryDate
        )}).`,
        relatedEntityId: doc.id,
        documentRecordId: doc.id,
        reminderField: "reminderH30SentAt",
      });
      await enqueueNotificationDispatch({ notificationId, userId: doc.owner.userId }).catch((err) => {
        console.error("Failed to enqueue expiry reminder notification H30:", err);
      });
      remindersSent.H30++;
    } else if (docTime === h7Date.getTime() && !doc.reminderH7SentAt) {
      const notificationId = crypto.randomUUID();
      await repo.createNotificationAndUpdateReminder({
        notificationId,
        userId: doc.owner.userId,
        title: "Peringatan Kedaluwarsa Dokumen (H-7)",
        message: `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa dalam 7 hari (${dateString(
          doc.expiryDate
        )}).`,
        relatedEntityId: doc.id,
        documentRecordId: doc.id,
        reminderField: "reminderH7SentAt",
      });
      await enqueueNotificationDispatch({ notificationId, userId: doc.owner.userId }).catch((err) => {
        console.error("Failed to enqueue expiry reminder notification H7:", err);
      });
      remindersSent.H7++;
    } else if (docTime === h1Date.getTime() && !doc.reminderH1SentAt) {
      const notificationId = crypto.randomUUID();
      await repo.createNotificationAndUpdateReminder({
        notificationId,
        userId: doc.owner.userId,
        title: "Peringatan Kedaluwarsa Dokumen (H-1)",
        message: `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa besok (${dateString(
          doc.expiryDate
        )}).`,
        relatedEntityId: doc.id,
        documentRecordId: doc.id,
        reminderField: "reminderH1SentAt",
      });
      await enqueueNotificationDispatch({ notificationId, userId: doc.owner.userId }).catch((err) => {
        console.error("Failed to enqueue expiry reminder notification H1:", err);
      });
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
