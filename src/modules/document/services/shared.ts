export type DocumentListFilter = {
  archiveView?: "active" | "archived";
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED";
  search?: string;
  page?: number;
  limit?: number;
};

export type DocumentTypeListFilter = {
  archiveCategory?: "PERSONAL" | "EDUCATION" | "EMPLOYMENT" | "CERTIFICATION" | "LEGAL";
  search?: string;
  page?: number;
  limit?: number;
};
