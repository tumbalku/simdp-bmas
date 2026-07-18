import crypto from "crypto";
import path from "path";
import { env } from "@/lib/env";
import { EVENT_NAMES, publishEvent } from "@/lib/events";
import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import type { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import * as repo from "../repository";
import { matchesDocumentTypeTarget } from "../target-rules";
import { STORAGE_PROVIDER_VALUE } from "../constants";

function getActiveStorageProviderValue() {
  if (env.STORAGE_PROVIDER === "supabase") return STORAGE_PROVIDER_VALUE.SUPABASE;
  if (env.STORAGE_PROVIDER === "s3") return STORAGE_PROVIDER_VALUE.S3;
  return STORAGE_PROVIDER_VALUE.LOCAL;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function formatDateSegment(date: Date) {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");

  return `${year}${month}${day}`;
}

function sanitizeFileNameSegment(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, "-");
}

function buildDocumentFileName(input: {
  identifier: string;
  archiveCategory: string;
  documentTypeCode: string;
  date: Date;
  sequence: number;
  ext: string;
}) {
  const identifier = sanitizeFileNameSegment(input.identifier);
  const archiveCategory = sanitizeFileNameSegment(input.archiveCategory);
  const documentTypeCode = sanitizeFileNameSegment(input.documentTypeCode);
  const date = formatDateSegment(input.date);

  return `${identifier}_${archiveCategory}_${documentTypeCode}_${date}_${input.sequence}.${input.ext}`;
}

async function publishDocumentVerificationRequested(input: {
  recipientUserIds: string[];
  documentRecordId: string;
  documentTypeName: string;
  ownerName: string;
  action: "UPLOADED" | "REPLACED";
}) {
  try {
    await publishEvent(EVENT_NAMES.DOCUMENT_VERIFICATION_REQUESTED, input);
    return { ok: true as const };
  } catch (error) {
    console.error("[DocumentUpload] Failed to publish verification notification event", {
      documentRecordId: input.documentRecordId,
      action: input.action,
      error,
    });

    return { ok: false as const, errorMessage: getErrorMessage(error) };
  }
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

  if (!docType.allowMultiple) {
    const activeCount = await repo.countActiveDocumentRecords(employee.id, docType.id);
    if (activeCount > 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Jenis dokumen ini hanya boleh memiliki satu dokumen aktif. Gunakan tombol Ganti untuk memperbarui file.",
        400
      );
    }
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

  // 5. Write record to DB and reserve filename sequence under a per-owner/type lock.
  const docId = crypto.randomUUID();

  const storageProvider = getActiveStorageProviderValue();
  const documentDate = data.issueDate ? new Date(data.issueDate) : new Date();
  const identifier = employee.nik || employee.employeeId || session.userId;

  const reservedUpload = await repo.reserveUploadedDocumentTransaction({
    docId,
    ownerId: employee.id,
    documentTypeId: docType.id,
    title: data.title || docType.name,
    buildFile: (sequence) => {
      const fileName = buildDocumentFileName({
        identifier,
        archiveCategory: docType.archiveCategory,
        documentTypeCode: docType.code,
        date: documentDate,
        sequence,
        ext,
      });
      const uploadPath = path.join(docType.code, fileName).replace(/\\/g, "/");

      return { fileName, uploadPath };
    },
    fileSize: BigInt(buffer.length),
    mimeType: data.file.type || null,
    fileHash,
    storageProvider,
    documentNumber: data.documentNumber || null,
    issueDate: data.issueDate ? new Date(data.issueDate) : null,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    createdBy: session.userId,
    allowMultiple: docType.allowMultiple,
    documentTypeName: docType.name,
    ownerName: employee.name,
  });
  let record = reservedUpload.record;

  try {
    const savedPath = await storage.upload(reservedUpload.uploadPath, buffer, data.file.type);
    record = await repo.finalizeDocumentFilePath(record.id, savedPath);
  } catch (error) {
    await repo.abortUploadedDocumentReservation({
      docId,
      replacedDocuments: reservedUpload.replacedDocuments,
    });
    throw error;
  }

  const replacedDocumentIds = reservedUpload.replacedDocuments.map((doc) => doc.id);
  const verificationRecipientUserIds = reservedUpload.verificationRecipientUserIds;

  for (const replacedDocumentId of replacedDocumentIds) {
    await logActivity({
      actorId: session.userId,
      actorName: employee.name,
      actorRole: session.role,
      eventType: SECURITY_EVENT_TYPE.DOCUMENT_DELETED,
      resource: `DocumentRecord:${replacedDocumentId}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { reason: "replaced_by_new_upload" },
    });
  }

  const notificationPublish = await publishDocumentVerificationRequested({
    recipientUserIds: verificationRecipientUserIds,
    documentRecordId: record.id,
    documentTypeName: docType.name,
    ownerName: employee.name,
    action: "UPLOADED",
  });

  await logActivity({
    actorId: session.userId,
    actorName: employee.name,
    actorRole: session.role,
    eventType: SECURITY_EVENT_TYPE.DOCUMENT_UPLOADED,
    resource: `DocumentRecord:${docId}`,
    ipAddress,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: {
      fileName: record.fileName,
      documentTypeId: docType.id,
      storageProvider,
      notificationPublish,
    },
  });

  return {
    id: record.id,
    status: record.status,
    fileName: record.fileName,
    filePath: record.filePath,
  };
}

export async function replaceDocumentFile(
  data: {
    documentId: string;
    file: File;
    title?: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
  },
  session: TokenPayload,
  ipAddress?: string | null
) {
  const doc = await repo.findDocumentRecordWithOwnerAndDocumentType(data.documentId);

  if (!doc) throw new AppError("NOT_FOUND", "Dokumen tidak ditemukan atau terhapus", 404);
  if (doc.owner.userId !== session.userId) {
    throw new AppError("OWNERSHIP_REQUIRED", "OWNERSHIP_REQUIRED", 403);
  }
  if (doc.documentType.deletedAt) {
    throw new AppError("VALIDATION_ERROR", "Jenis dokumen tidak ditemukan atau tidak aktif", 400);
  }
  if (!["PENDING", "APPROVED", "REJECTED"].includes(doc.status)) {
    throw new AppError("VALIDATION_ERROR", "Status dokumen tidak dapat diganti file.", 400);
  }
  if (!matchesDocumentTypeTarget(doc.owner, doc.documentType)) {
    throw new AppError("FORBIDDEN", "Jenis dokumen ini tidak berlaku untuk data kepegawaian Anda.", 403);
  }

  if (doc.documentType.requiresDocumentNumber && !data.documentNumber) {
    throw new AppError("VALIDATION_ERROR", "Nomor dokumen wajib diisi untuk jenis dokumen ini.", 400);
  }
  if (doc.documentType.requiresIssueDate && !data.issueDate) {
    throw new AppError("VALIDATION_ERROR", "Tanggal terbit wajib diisi untuk jenis dokumen ini.", 400);
  }
  if (doc.documentType.requiresExpiryDate && !data.expiryDate) {
    throw new AppError("VALIDATION_ERROR", "Tanggal kedaluwarsa wajib diisi untuk jenis dokumen ini.", 400);
  }

  const fileArrayBuffer = await data.file.arrayBuffer();
  const buffer = Buffer.from(fileArrayBuffer);
  const sizeMb = buffer.length / (1024 * 1024);

  if (sizeMb > doc.documentType.maxSizeMb) {
    throw new AppError("PAYLOAD_TOO_LARGE", `Ukuran file melebihi batas maksimal ${doc.documentType.maxSizeMb} MB.`, 413);
  }

  const ext = validateFileFormat(buffer, doc.documentType.allowedFormats);
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  const storageProvider = getActiveStorageProviderValue();
  const documentDate = data.issueDate ? new Date(data.issueDate) : doc.issueDate ?? new Date();
  const identifier = doc.owner.nik || doc.owner.employeeId || session.userId;

  const reservedReplace = await repo.reserveReplaceDocumentFileTransaction({
    documentId: doc.id,
    ownerId: doc.ownerId,
    documentTypeId: doc.documentTypeId,
    buildFile: (sequence) => {
      const fileName = buildDocumentFileName({
        identifier,
        archiveCategory: doc.documentType.archiveCategory,
        documentTypeCode: doc.documentType.code,
        date: documentDate,
        sequence,
        ext,
      });
      const uploadPath = path.join(doc.documentType.code, fileName).replace(/\\/g, "/");

      return { fileName, uploadPath };
    },
    fileSize: BigInt(buffer.length),
    mimeType: data.file.type || null,
    fileHash,
    storageProvider,
    updatedBy: session.userId,
    documentTypeName: doc.documentType.name,
    ownerName: doc.owner.name,
    title: data.title || doc.title || doc.documentType.name,
    documentNumber: doc.documentType.requiresDocumentNumber ? data.documentNumber || null : doc.documentNumber,
    issueDate: doc.documentType.requiresIssueDate && data.issueDate ? new Date(data.issueDate) : doc.issueDate,
    expiryDate: doc.documentType.requiresExpiryDate && data.expiryDate ? new Date(data.expiryDate) : doc.expiryDate,
  });
  let record = reservedReplace.record;

  try {
    const savedPath = await storage.upload(reservedReplace.uploadPath, buffer, data.file.type);
    record = await repo.finalizeDocumentFilePath(record.id, savedPath);
  } catch (error) {
    await repo.abortReplaceDocumentReservation({
      documentId: doc.id,
      previousRecord: reservedReplace.previousRecord,
      verificationHistoryId: reservedReplace.verificationHistoryId,
    });
    throw error;
  }

  const verificationRecipientUserIds = reservedReplace.verificationRecipientUserIds;

  const notificationPublish = await publishDocumentVerificationRequested({
    recipientUserIds: verificationRecipientUserIds,
    documentRecordId: record.id,
    documentTypeName: doc.documentType.name,
    ownerName: doc.owner.name,
    action: "REPLACED",
  });

  await logActivity({
    actorId: session.userId,
    actorName: doc.owner.name,
    actorRole: session.role,
    eventType: SECURITY_EVENT_TYPE.DOCUMENT_UPLOADED,
    resource: `DocumentRecord:${doc.id}`,
    ipAddress,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: {
      action: "replace_file",
      documentTypeId: doc.documentTypeId,
      fileName: record.fileName,
      previousFilePath: doc.filePath,
      storageProvider,
      notificationPublish,
    },
  });

  return {
    id: record.id,
    status: record.status,
    fileName: record.fileName,
    filePath: record.filePath,
  };
}
