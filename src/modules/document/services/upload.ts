import crypto from "crypto";
import path from "path";
import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import type { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import * as repo from "../repository";
import { matchesDocumentTypeTarget } from "../target-rules";
import { STORAGE_PROVIDER_VALUE } from "../constants";

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
    storageProvider: STORAGE_PROVIDER_VALUE.LOCAL,
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
      eventType: SECURITY_EVENT_TYPE.DOCUMENT_DELETED,
      resource: `DocumentRecord:${replacedDocumentId}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { reason: "replaced_by_new_upload" },
    });
  }

  await logActivity({
    actorId: session.userId,
    actorName: employee.name,
    actorRole: session.role,
    eventType: SECURITY_EVENT_TYPE.DOCUMENT_UPLOADED,
    resource: `DocumentRecord:${docId}`,
    ipAddress,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { fileName, documentTypeId: docType.id },
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
  const existingCount = await repo.countDocumentRecords(doc.ownerId, doc.documentTypeId);
  const sequence = existingCount + 1;
  const identifier = doc.owner.employeeId || doc.owner.nik || session.userId;
  const fileName = `${doc.documentType.code}-${sequence}-${identifier}.${ext}`;
  const uploadPath = path.join(doc.documentType.code, fileName).replace(/\\/g, "/");
  const savedPath = await storage.upload(uploadPath, buffer, data.file.type);

  const record = await repo.replaceDocumentFileTransaction({
    documentId: doc.id,
    fileName,
    filePath: savedPath,
    fileSize: BigInt(buffer.length),
    mimeType: data.file.type || null,
    fileHash,
    storageProvider: STORAGE_PROVIDER_VALUE.LOCAL,
    updatedBy: session.userId,
    documentTypeName: doc.documentType.name,
    ownerName: doc.owner.name,
    title: data.title || doc.title || doc.documentType.name,
    documentNumber: doc.documentType.requiresDocumentNumber ? data.documentNumber || null : doc.documentNumber,
    issueDate: doc.documentType.requiresIssueDate && data.issueDate ? new Date(data.issueDate) : doc.issueDate,
    expiryDate: doc.documentType.requiresExpiryDate && data.expiryDate ? new Date(data.expiryDate) : doc.expiryDate,
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
      fileName,
      previousFilePath: doc.filePath,
    },
  });

  return {
    id: record.id,
    status: record.status,
    fileName: record.fileName,
    filePath: record.filePath,
  };
}
