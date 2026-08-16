export type DocumentListFilter = {
  archiveView?: "active" | "archived";
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED";
  search?: string;
  documentTypeId?: string;
  archiveCategory?: "PERSONAL" | "EDUCATION" | "EMPLOYMENT" | "CERTIFICATION" | "LEGAL";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type DocumentTypeListFilter = {
  archiveCategory?: "PERSONAL" | "EDUCATION" | "EMPLOYMENT" | "CERTIFICATION" | "LEGAL";
  search?: string;
  page?: number;
  limit?: number;
};
