import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import type { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import * as repo from "../repository";

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
        eventType: SECURITY_EVENT_TYPE.DOCUMENT_DOWNLOADED,
        resource: `DocumentRecord:${documentId}`,
        status: SECURITY_LOG_STATUS.FAILED,
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
    eventType: SECURITY_EVENT_TYPE.DOCUMENT_DOWNLOADED,
    resource: `DocumentRecord:${documentId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
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
