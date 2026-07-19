import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import type { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import * as repo from "../repository";

export async function softDeleteDocument(documentId: string, session: TokenPayload) {
  const doc = await repo.findDocumentRecordWithOwner(documentId);

  if (!doc) throw new Error("Dokumen tidak ditemukan");

  // Ownership check
  if (session.role === "EMPLOYEE") {
    if (doc.owner.userId !== session.userId) {
      throw new Error("OWNERSHIP_REQUIRED");
    }
  }

  await repo.softDeleteDocumentRecord(documentId);

  await logActivity({
    actorId: session.userId,
    actorName: doc.owner.name,
    actorRole: session.role,
    eventType: SECURITY_EVENT_TYPE.DOCUMENT_DELETED,
    resource: `DocumentRecord:${documentId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return true;
}

export async function restoreDocument(documentId: string, session: TokenPayload) {
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  const doc = await repo.findDocumentRecordWithDeletedWithOwner(documentId);

  if (!doc) throw new Error("Dokumen tidak ditemukan");

  if (!doc.deletedAt) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Dokumen ini sudah aktif dan tidak perlu dipulihkan.",
      400
    );
  }

  if (!doc.documentType.allowMultiple) {
    const activeDocument = await repo.findActiveDocumentRecordByOwnerAndType(doc.ownerId, doc.documentTypeId);
    if (activeDocument) {
      throw new AppError(
        "CONFLICT",
        `Dokumen tidak bisa dipulihkan karena pegawai ini sudah memiliki dokumen aktif untuk jenis yang sama: "${activeDocument.fileName}". Arsipkan atau hapus permanen dokumen aktif tersebut terlebih dahulu.`,
        409
      );
    }
  }

  await repo.restoreDocumentRecord(documentId, doc.documentType.allowMultiple);

  await logActivity({
    actorId: session.userId,
    actorName: doc.owner.name,
    actorRole: session.role,
    eventType: SECURITY_EVENT_TYPE.DOCUMENT_RESTORED,
    resource: `DocumentRecord:${documentId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });

  return true;
}

export async function permanentlyDeleteDocument(documentId: string, session: TokenPayload) {
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  const doc = await repo.findDocumentRecordWithDeletedWithOwner(documentId);

  if (!doc) throw new Error("Dokumen tidak ditemukan");
  if (!doc.deletedAt) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Dokumen aktif harus diarsipkan terlebih dahulu sebelum dihapus permanen.",
      400
    );
  }

  await storage.delete(doc.filePath);
  await repo.permanentlyDeleteDocumentRecord(documentId);

  await logActivity({
    actorId: session.userId,
    actorName: doc.owner.name,
    actorRole: session.role,
    eventType: SECURITY_EVENT_TYPE.DOCUMENT_PERMANENTLY_DELETED,
    resource: `DocumentRecord:${documentId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: {
      fileName: doc.fileName,
      filePath: doc.filePath,
      ownerId: doc.ownerId,
    },
  });

  return true;
}
