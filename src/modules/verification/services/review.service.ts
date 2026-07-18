import crypto from "crypto";
import { EVENT_NAMES, publishEvent } from "@/lib/events";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repositories/common";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

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

  let notificationPublish:
    | { ok: true }
    | { ok: false; errorMessage: string } = { ok: true };

  try {
    if (decision === "APPROVED") {
      await publishEvent(EVENT_NAMES.VERIFICATION_APPROVED, {
        userId: doc.owner.userId,
        documentRecordId: id,
        documentTypeName: doc.documentType.name,
      });
    } else {
      await publishEvent(EVENT_NAMES.VERIFICATION_REJECTED, {
        userId: doc.owner.userId,
        documentRecordId: id,
        documentTypeName: doc.documentType.name,
        note: note ?? "",
      });
    }
  } catch (error) {
    console.error("[Verification] Failed to publish verification result notification event", {
      documentRecordId: id,
      decision,
      error,
    });
    notificationPublish = { ok: false, errorMessage: getErrorMessage(error) };
  }

  await logActivity({
    actorId: reviewerId,
    actorName: reviewerName,
    actorRole: reviewerRole,
    eventType:
      decision === "APPROVED" ? SECURITY_EVENT_TYPE.DOCUMENT_APPROVED : SECURITY_EVENT_TYPE.DOCUMENT_REJECTED,
    resource: `DocumentRecord:${id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { reviewNote: note, notificationPublish },
  });

  return {
    id: result.id,
    status: result.status,
  };
}
