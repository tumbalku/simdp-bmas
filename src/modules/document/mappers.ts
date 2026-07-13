/* eslint-disable @typescript-eslint/no-explicit-any */
import { bigIntToNumber } from "@/lib/utils";

export function mapDocumentRecord(record: any) {
  return {
    id: record.id,
    title: record.title || record.documentType?.name || "Dokumen",
    status: record.status,
    uploadedAt: record.uploadedAt?.toISOString?.() ?? record.uploadedAt,
    expiryDate: record.expiryDate ? record.expiryDate.toISOString?.() ?? record.expiryDate : null,
    fileName: record.fileName,
    fileSize: bigIntToNumber(record.fileSize),
    documentTypeId: record.documentType?.id ?? record.documentTypeId,
    documentTypeName: record.documentType?.name || "Jenis dokumen",
    archiveCategory: record.documentType?.archiveCategory || "PERSONAL",
    ownerId: record.owner?.id ?? record.ownerId,
    ownerName: record.owner?.name || "Pegawai",
    ownerEmployeeId: record.owner?.employeeId || null,
    ownerNik: record.owner?.nik || null,
  };
}

export function mapDocumentType(type: any) {
  return {
    id: type.id,
    code: type.code,
    name: type.name,
    description: type.description,
    archiveCategory: type.archiveCategory,
    isMandatory: type.isMandatory,
    allowMultiple: type.allowMultiple,
    requiresExpiryDate: type.requiresExpiryDate,
    requiresIssueDate: type.requiresIssueDate,
    requiresDocumentNumber: type.requiresDocumentNumber,
    allowedFormats: type.allowedFormats,
    maxSizeMb: type.maxSizeMb,
  };
}

export function mapDocumentDetail(record: any) {
  return {
    ...mapDocumentRecord(record),
    documentNumber: record.documentNumber,
    issueDate: record.issueDate ? record.issueDate.toISOString?.() ?? record.issueDate : null,
    mimeType: record.mimeType,
    verificationHistories: (record.verificationHistories || []).map((item: any) => ({
      id: item.id,
      status: item.status,
      reviewNote: item.reviewNote,
      reviewedAt: item.reviewedAt?.toISOString?.() ?? item.reviewedAt,
      reviewerName: item.reviewedBy?.employee?.name || item.reviewedBy?.email || "Sistem",
    })),
  };
}
