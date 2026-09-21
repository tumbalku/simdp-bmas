import crypto from "crypto";
import path from "path";
import { env } from "@/lib/env";
import { EVENT_NAMES, publishEvent } from "@/lib/events";
import { scanFileBuffer, type MalwareScanResult } from "@/lib/malware-scanner";
import { storage } from "@/lib/storage";
import { normalizeStoragePath } from "@/lib/storage/path";
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

type DocumentUploadInput = {
  documentTypeId: string;
  file: File;
  title?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  periodStartDate?: string;
  periodEndDate?: string;
};

type DocumentReplaceInput = {
  documentId: string;
  file: File;
  title?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  periodStartDate?: string;
  periodEndDate?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function isValidDateString(value?: string) {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function parseDateOrThrow(value: string, fieldLabel: string) {
  if (!isValidDateString(value)) {
    throw new AppError("VALIDATION_ERROR", `Format tanggal ${fieldLabel} tidak valid.`, 400);
  }
  return new Date(value);
}

/**
 * Memvalidasi field periodik dokumen sesuai flag `DocumentType.requiresPeriod`.
 * Trigger DB (`validate_document_fields`) menerapkan aturan yang sama, namun
 * validasi ini dilakukan di service agar error langsung menjadi `AppError` 400
 * yang informatif (bukan exception mentah PostgreSQL yang menjadi 500 generik),
 * dan agar aturan tetap berlaku pada konteks tanpa trigger (DB test, hasil
 * restore tanpa trigger, tooling script) — defense-in-depth.
 */
function validatePeriodFields(
  requiresPeriod: boolean | null | undefined,
  input: { periodStartDate?: string; periodEndDate?: string },
) {
  const hasStart = Boolean(input.periodStartDate);
  const hasEnd = Boolean(input.periodEndDate);

  if (requiresPeriod) {
    if (!hasStart || !hasEnd) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Periode mulai dan periode berakhir wajib diisi untuk jenis dokumen ini.",
        400,
      );
    }
  } else if (hasStart || hasEnd) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Jenis dokumen ini tidak menggunakan periode. Hapus periode mulai dan periode berakhir.",
      400,
    );
  }

  if (hasStart && hasEnd) {
    const start = parseDateOrThrow(input.periodStartDate as string, "periode mulai");
    const end = parseDateOrThrow(input.periodEndDate as string, "periode berakhir");

    if (end < start) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Periode berakhir harus sama atau setelah periode mulai.",
        400,
      );
    }
  }
}

function normalizePeriodInput(input: { periodStartDate?: string; periodEndDate?: string }) {
  if (!input.periodStartDate && !input.periodEndDate) {
    return { periodStartDate: null, periodEndDate: null };
  }

  return {
    periodStartDate: input.periodStartDate ? parseDateOrThrow(input.periodStartDate, "periode mulai") : null,
    periodEndDate: input.periodEndDate ? parseDateOrThrow(input.periodEndDate, "periode berakhir") : null,
  };
}

function validateRequiredDocumentFields(
  docType: {
    requiresDocumentNumber?: boolean | null;
    requiresIssueDate?: boolean | null;
    requiresExpiryDate?: boolean | null;
  },
  data: { documentNumber?: string; issueDate?: string; expiryDate?: string },
) {
  if (docType.requiresDocumentNumber && !data.documentNumber) {
    throw new AppError("VALIDATION_ERROR", "Nomor dokumen wajib diisi untuk jenis dokumen ini.", 400);
  }
  if (docType.requiresIssueDate && !data.issueDate) {
    throw new AppError("VALIDATION_ERROR", "Tanggal terbit wajib diisi untuk jenis dokumen ini.", 400);
  }
  if (docType.requiresExpiryDate && !data.expiryDate) {
    throw new AppError("VALIDATION_ERROR", "Tanggal kedaluwarsa wajib diisi untuk jenis dokumen ini.", 400);
  }
}

/**
 * Menentukan status awal dan flag `isFinal` secara paralel dengan trigger DB
 * (`handle_document_replacement`). Trigger tetap merupakan sumber kebenaran
 * tunggal untuk nilai yang disimpan (lihat ADR di decisions-log.md); fungsi ini
 * hanya memastikan service memilih status awal yang konsisten sehingga
 * `VerificationHistory` PENDING tidak dibuat ganda untuk upload admin auto-final.
 */
function resolveAutoFinalFields(
  docType: { adminUploadAutoFinal?: boolean | null },
  role: TokenPayload["role"],
) {
  const isAdminOrStaff = role === "ADMIN" || role === "STAFF";
  const isAutoFinal = Boolean(docType.adminUploadAutoFinal) && isAdminOrStaff;

  return {
    isFinal: isAutoFinal,
    status: isAutoFinal ? ("APPROVED" as const) : ("PENDING" as const),
  };
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

async function logMalwareScanFailure(input: {
  session: TokenPayload;
  actorName: string;
  resource: string;
  ipAddress?: string | null;
  documentTypeId: string;
  fileName: string;
  mimeType?: string | null;
  fileSize: number;
  result: Extract<MalwareScanResult, { status: "INFECTED" | "ERROR" }>;
}) {
  await logActivity({
    actorId: input.session.userId,
    actorName: input.actorName,
    actorRole: input.session.role,
    eventType:
      input.result.status === "INFECTED"
        ? SECURITY_EVENT_TYPE.DOCUMENT_MALWARE_DETECTED
        : SECURITY_EVENT_TYPE.DOCUMENT_MALWARE_SCAN_FAILED,
    resource: input.resource,
    ipAddress: input.ipAddress,
    status: SECURITY_LOG_STATUS.FAILED,
    metadata: {
      documentTypeId: input.documentTypeId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      scannerProvider: input.result.provider,
      ...(input.result.status === "INFECTED"
        ? { signature: input.result.signature }
        : { errorMessage: input.result.errorMessage }),
    },
  });
}

async function enforceMalwareScan(input: {
  buffer: Buffer;
  originalFileName: string;
  mimeType?: string | null;
  session: TokenPayload;
  actorName: string;
  resource: string;
  ipAddress?: string | null;
  documentTypeId: string;
}) {
  const result = await scanFileBuffer(input.buffer, {
    fileName: input.originalFileName,
    mimeType: input.mimeType,
  });

  if (result.status === "CLEAN") return;

  await logMalwareScanFailure({
    session: input.session,
    actorName: input.actorName,
    resource: input.resource,
    ipAddress: input.ipAddress,
    documentTypeId: input.documentTypeId,
    fileName: input.originalFileName,
    mimeType: input.mimeType,
    fileSize: input.buffer.length,
    result,
  });

  if (result.status === "INFECTED") {
    throw new AppError("MALWARE_DETECTED", "Upload ditolak karena file terdeteksi berbahaya.", 422);
  }

  throw new AppError(
    "MALWARE_SCAN_UNAVAILABLE",
    "Upload belum dapat diproses karena pemeriksaan keamanan tidak tersedia. Coba lagi nanti.",
    503,
  );
}

export async function uploadDocumentRecord(
  data: DocumentUploadInput,
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

  // 3. Validate conditional fields (service-side, parallel to DB trigger
  // `validate_document_fields` so input errors surface as AppError 400).
  validateRequiredDocumentFields(docType, data);
  validatePeriodFields(docType.requiresPeriod, data);

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

  await enforceMalwareScan({
    buffer,
    originalFileName: data.file.name,
    mimeType: data.file.type || "application/octet-stream",
    session,
    actorName: employee.name,
    resource: `DocumentUpload:${docType.id}`,
    ipAddress,
    documentTypeId: docType.id,
  });

  // Calculate SHA-256 hash
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // 5. Write record to DB and reserve filename sequence under a per-owner/type lock.
  const docId = crypto.randomUUID();
  const storedFileId = crypto.randomUUID();

  const storageProvider = getActiveStorageProviderValue();
  const documentDate = data.issueDate ? new Date(data.issueDate) : new Date();
  const identifier = employee.nik || employee.employeeId || session.userId;

  const reservedUpload = await repo.reserveDocumentFileTransaction({
    storedFileId,
    ownerId: employee.id,
    documentTypeId: docType.id,
    buildFile: (sequence) => {
      const fileName = buildDocumentFileName({
        identifier,
        archiveCategory: docType.archiveCategory,
        documentTypeCode: docType.code,
        date: documentDate,
        sequence,
        ext,
      });
      const uploadPath = normalizeStoragePath(path.join(docType.code, fileName));

      return { fileName, uploadPath };
    },
    fileSize: BigInt(buffer.length),
    mimeType: data.file.type || "application/octet-stream",
    fileHash,
    storageProvider,
    uploadedBy: session.userId,
  });
  let savedPath: string | null = null;
  let finalizedUpload: Awaited<ReturnType<typeof repo.finalizeDocumentUploadTransaction>>;

  const autoFinal = resolveAutoFinalFields(docType, session.role);
  const periodDates = normalizePeriodInput(data);

  try {
    const uploadedPath = await storage.upload(reservedUpload.uploadPath, buffer, data.file.type);
    savedPath = uploadedPath;
    finalizedUpload = await repo.finalizeDocumentUploadTransaction({
      docId,
      storedFileId,
      savedPath: uploadedPath,
      ownerId: employee.id,
      documentTypeId: docType.id,
      title: data.title || docType.name,
      documentNumber: data.documentNumber || null,
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      periodStartDate: periodDates.periodStartDate,
      periodEndDate: periodDates.periodEndDate,
      createdBy: session.userId,
      replacesDocumentId: null,
      allowMultiple: docType.allowMultiple,
      initialStatus: autoFinal.status,
      isFinal: autoFinal.isFinal,
    });
  } catch (error) {
    if (savedPath) await storage.delete(savedPath).catch(() => undefined);
    await repo.abortDocumentFileReservation(storedFileId).catch(() => undefined);
    throw error;
  }

  const record = finalizedUpload.record;

  const replacedDocumentIds = finalizedUpload.replacedDocuments.map((doc) => doc.id);
  const verificationRecipientUserIds = finalizedUpload.verificationRecipientUserIds;

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
    resource: `DocumentRecord:${record.id}`,
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
  data: DocumentReplaceInput,
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

  validateRequiredDocumentFields(doc.documentType, data);
  validatePeriodFields(doc.documentType.requiresPeriod, data);

  const fileArrayBuffer = await data.file.arrayBuffer();
  const buffer = Buffer.from(fileArrayBuffer);
  const sizeMb = buffer.length / (1024 * 1024);

  if (sizeMb > doc.documentType.maxSizeMb) {
    throw new AppError("PAYLOAD_TOO_LARGE", `Ukuran file melebihi batas maksimal ${doc.documentType.maxSizeMb} MB.`, 413);
  }

  const ext = validateFileFormat(buffer, doc.documentType.allowedFormats);

  await enforceMalwareScan({
    buffer,
    originalFileName: data.file.name,
    mimeType: data.file.type || "application/octet-stream",
    session,
    actorName: doc.owner.name,
    resource: `DocumentRecord:${doc.id}`,
    ipAddress,
    documentTypeId: doc.documentTypeId,
  });

  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  const storageProvider = getActiveStorageProviderValue();
  const documentDate = data.issueDate ? new Date(data.issueDate) : doc.issueDate ?? new Date();
  const identifier = doc.owner.nik || doc.owner.employeeId || session.userId;

  const replacementDocumentId = crypto.randomUUID();
  const storedFileId = crypto.randomUUID();
  const autoFinal = resolveAutoFinalFields(doc.documentType, session.role);
  const periodDates = normalizePeriodInput(data);
  const reservedReplace = await repo.reserveDocumentFileTransaction({
    storedFileId,
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
      const uploadPath = normalizeStoragePath(path.join(doc.documentType.code, fileName));

      return { fileName, uploadPath };
    },
    fileSize: BigInt(buffer.length),
    mimeType: data.file.type || "application/octet-stream",
    fileHash,
    storageProvider,
    uploadedBy: session.userId,
  });
  let savedPath: string | null = null;
  let finalizedReplace: Awaited<ReturnType<typeof repo.finalizeDocumentUploadTransaction>>;

  try {
    const uploadedPath = await storage.upload(reservedReplace.uploadPath, buffer, data.file.type);
    savedPath = uploadedPath;
    finalizedReplace = await repo.finalizeDocumentUploadTransaction({
      docId: replacementDocumentId,
      storedFileId,
      savedPath: uploadedPath,
      ownerId: doc.ownerId,
      documentTypeId: doc.documentTypeId,
      title: data.title || doc.title || doc.documentType.name,
      documentNumber: doc.documentType.requiresDocumentNumber ? data.documentNumber || null : doc.documentNumber,
      issueDate: doc.documentType.requiresIssueDate && data.issueDate ? new Date(data.issueDate) : doc.issueDate,
      expiryDate: doc.documentType.requiresExpiryDate && data.expiryDate ? new Date(data.expiryDate) : doc.expiryDate,
      periodStartDate: periodDates.periodStartDate ?? doc.periodStartDate,
      periodEndDate: periodDates.periodEndDate ?? doc.periodEndDate,
      createdBy: session.userId,
      replacesDocumentId: doc.id,
      allowMultiple: doc.documentType.allowMultiple,
      initialStatus: autoFinal.status,
      isFinal: autoFinal.isFinal,
    });
  } catch (error) {
    if (savedPath) await storage.delete(savedPath).catch(() => undefined);
    await repo.abortDocumentFileReservation(storedFileId).catch(() => undefined);
    throw error;
  }

  const record = finalizedReplace.record;

  const verificationRecipientUserIds = finalizedReplace.verificationRecipientUserIds;

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
    resource: `DocumentRecord:${record.id}`,
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
