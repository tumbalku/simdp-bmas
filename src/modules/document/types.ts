export type DocumentStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED";

export type ArchiveCategoryValue = "PERSONAL" | "EDUCATION" | "EMPLOYMENT" | "CERTIFICATION" | "LEGAL";

export type DocumentRecordListItem = {
  id: string;
  title: string;
  status: DocumentStatusValue | string;
  uploadedAt: string;
  issueDate: string | null;
  expiryDate: string | null;
  documentNumber: string | null;
  fileName: string;
  fileSize: number | null;
  documentTypeId: string;
  documentTypeName: string;
  archiveCategory: ArchiveCategoryValue | string;
  ownerName: string;
  ownerEmployeeId: string | null;
};

export type DocumentTypeOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  archiveCategory: ArchiveCategoryValue | string;
  isMandatory: boolean;
  allowMultiple: boolean;
  allowedFormats: string;
  maxSizeMb: number;
  requiresDocumentNumber: boolean;
  requiresIssueDate: boolean;
  requiresExpiryDate: boolean;
};
