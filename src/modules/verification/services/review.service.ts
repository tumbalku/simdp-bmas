import crypto from "crypto";
import { logActivity } from "@/modules/security/server";
import { NOTIFICATION_RELATED_ENTITY_TYPE, NOTIFICATION_TYPE } from "@/modules/notification";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repositories/common";

export async function verifyDocument(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note: string | undefined,
  reviewerId: string,
  reviewerName: string,
  reviewerRole: string
) {
  const doc = await repo.findDocumentForVerification(id);

  if (!doc) throw new Error("Dokumen tidak ditemukan atau sudah dihapus");

  if (decision === "REJECTED" && (!note || note.trim().length < 5)) {
    throw new Error("Catatan penolakan (note) wajib diisi minimal 5 karakter.");
  }

  const result = await repo.updateDocumentVerificationStatus({
    id,
    status: decision,
    verificationHistoryId: crypto.randomUUID(),
    reviewerId,
    reviewNote: note,
  });

  const { createNotification } = await import("@/modules/notification/server");
  await createNotification({
    userId: doc.owner.userId,
    type: NOTIFICATION_TYPE.DOCUMENT_STATUS,
    title: decision === "APPROVED" ? "Dokumen Disetujui" : "Dokumen Ditolak",
    message: `Dokumen ${doc.documentType.name} Anda telah ${
      decision === "APPROVED" ? "disetujui" : "ditolak"
    }.${note ? ` Catatan: ${note}` : ""}`,
    relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD,
    relatedEntityId: id,
  });

  await logActivity({
    actorId: reviewerId,
    actorName: reviewerName,
    actorRole: reviewerRole,
    eventType:
      decision === "APPROVED" ? SECURITY_EVENT_TYPE.DOCUMENT_APPROVED : SECURITY_EVENT_TYPE.DOCUMENT_REJECTED,
    resource: `DocumentRecord:${id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { reviewNote: note },
  });

  return {
    id: result.id,
    status: result.status,
  };
}
