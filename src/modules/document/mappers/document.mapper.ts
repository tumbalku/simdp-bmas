/* eslint-disable @typescript-eslint/no-explicit-any */
import { bigIntToNumber } from "@/utils";

export function mapDocumentRecord(record: any) {
  return {
    id: record.id,
    title: record.title || record.documentType?.name || "Dokumen",
    status: record.status,
    uploadedAt: record.uploadedAt?.toISOString?.() ?? record.uploadedAt,
    issueDate: record.issueDate ? record.issueDate.toISOString?.() ?? record.issueDate : null,
    expiryDate: record.expiryDate ? record.expiryDate.toISOString?.() ?? record.expiryDate : null,
    documentNumber: record.documentNumber || null,
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
    maxSizeMb: Number(type.maxSizeMb ?? 0),
  };
}

export function mapDocumentTypeSummary(type: any) {
  return {
    ...mapDocumentType(type),
    targetSummary: {
      employmentStatuses: type.employmentStatuses?.map((item: any) => item.employmentStatus?.name).filter(Boolean) ?? [],
      employeeGroups: type.employeeGroups?.map((item: any) => item.employeeGroup?.name).filter(Boolean) ?? [],
      employeePositions: type.employeePositions?.map((item: any) => item.employeePosition?.name).filter(Boolean) ?? [],
      professionGroups: type.professionGroups?.map((item: any) => item.professionGroup?.name).filter(Boolean) ?? [],
      employeeRanks: type.employeeRanks?.map((item: any) => item.employeeRank?.name).filter(Boolean) ?? [],
      workplaces: type.workplaces?.map((item: any) => item.workplace?.name).filter(Boolean) ?? [],
    },
  };
}

export function mapDocumentTypeFormInitialData(type: any) {
  return {
    ...mapDocumentType(type),
    employmentStatusIds: type.employmentStatuses?.map((item: any) => item.employmentStatusId).filter(Boolean) ?? [],
    employeeGroupIds: type.employeeGroups?.map((item: any) => item.employeeGroupId).filter(Boolean) ?? [],
    professionGroupIds: type.professionGroups?.map((item: any) => item.professionGroupId).filter(Boolean) ?? [],
    employeePositionIds: type.employeePositions?.map((item: any) => item.employeePositionId).filter(Boolean) ?? [],
    employeeRankIds: type.employeeRanks?.map((item: any) => item.employeeRankId).filter(Boolean) ?? [],
    workplaceIds: type.workplaces?.map((item: any) => item.workplaceId).filter(Boolean) ?? [],
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
