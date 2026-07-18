import { TokenPayload } from "@/lib/auth";
import { bigIntToNumber } from "@/utils";
import * as repo from "../repositories/common";

export async function getVerificationDocumentDetail(documentId: string, session: TokenPayload) {
  const record = await repo.findVerificationDocumentDetail(documentId);

  if (!record) throw new Error("Dokumen tidak ditemukan");

  if (session.role === "EMPLOYEE" && record.owner.userId !== session.userId) {
    throw new Error("FORBIDDEN");
  }

  return {
    id: record.id,
    title: record.title || record.documentType?.name || "Dokumen",
    status: record.status,
    uploadedAt: record.uploadedAt.toISOString(),
    expiryDate: record.expiryDate ? record.expiryDate.toISOString() : null,
    issueDate: record.issueDate ? record.issueDate.toISOString() : null,
    documentNumber: record.documentNumber,
    fileName: record.fileName,
    fileSize: bigIntToNumber(record.fileSize),
    mimeType: record.mimeType,
    documentTypeName: record.documentType?.name || "Jenis dokumen",
    archiveCategory: record.documentType?.archiveCategory || "PERSONAL",
    ownerName: record.owner?.name || "Pegawai",
    ownerEmployeeId: record.owner?.employeeId || null,
    ownerNik: record.owner?.nik || null,
    ownerWorkplace: record.owner?.workplace?.name || null,
    verificationHistories: record.verificationHistories.map((vh) => ({
      id: vh.id,
      status: vh.status,
      reviewNote: vh.reviewNote,
      reviewedAt: vh.reviewedAt.toISOString(),
      reviewerName: vh.reviewedBy?.employee?.name || vh.reviewedBy?.email || "Sistem",
    })),
  };
}
