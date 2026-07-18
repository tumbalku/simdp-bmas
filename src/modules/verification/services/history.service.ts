import { TokenPayload } from "@/lib/auth";
import * as repo from "../repositories/common";

export async function getVerificationHistory(documentId: string, session: TokenPayload) {
  const doc = await repo.findDocumentWithOwner(documentId);

  if (!doc) throw new Error("Dokumen tidak ditemukan");

  if (session.role === "EMPLOYEE") {
    if (doc.owner.userId !== session.userId) {
      throw new Error("OWNERSHIP_REQUIRED");
    }
  }

  const histories = await repo.findVerificationHistories(documentId);

  return histories.map((vh) => ({
    id: vh.id,
    status: vh.status,
    reviewNote: vh.reviewNote,
    reviewedAt: vh.reviewedAt.toISOString(),
    reviewedBy: vh.reviewedBy
      ? {
          name: vh.reviewedBy.employee?.name || vh.reviewedBy.email,
        }
      : { name: "System" },
  }));
}
