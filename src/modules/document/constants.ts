export const DOCUMENT_STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  REPLACED: "Diganti",
} as const;

export const DOCUMENT_STATUS_VARIANTS = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
  REPLACED: "outline",
} as const satisfies Record<keyof typeof DOCUMENT_STATUS_LABELS, "default" | "secondary" | "destructive" | "outline">;

export const DOCUMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: DOCUMENT_STATUS_LABELS.PENDING },
  { value: "APPROVED", label: DOCUMENT_STATUS_LABELS.APPROVED },
  { value: "REJECTED", label: DOCUMENT_STATUS_LABELS.REJECTED },
  { value: "EXPIRED", label: DOCUMENT_STATUS_LABELS.EXPIRED },
  { value: "REPLACED", label: DOCUMENT_STATUS_LABELS.REPLACED },
] as const;

export const ARCHIVE_CATEGORY_ICON_KEYS = {
  PERSONAL: "user",
  EDUCATION: "graduationCap",
  EMPLOYMENT: "briefcase",
  CERTIFICATION: "award",
  LEGAL: "scale",
} as const;

export const ARCHIVE_CATEGORY_LABELS = {
  PERSONAL: "Personal",
  EDUCATION: "Pendidikan",
  EMPLOYMENT: "Kepegawaian",
  CERTIFICATION: "Sertifikasi",
  LEGAL: "Legal",
} as const;

export const ARCHIVE_CATEGORY_OPTIONS = [
  { value: "PERSONAL", label: ARCHIVE_CATEGORY_LABELS.PERSONAL },
  { value: "EDUCATION", label: ARCHIVE_CATEGORY_LABELS.EDUCATION },
  { value: "EMPLOYMENT", label: ARCHIVE_CATEGORY_LABELS.EMPLOYMENT },
  { value: "CERTIFICATION", label: ARCHIVE_CATEGORY_LABELS.CERTIFICATION },
  { value: "LEGAL", label: ARCHIVE_CATEGORY_LABELS.LEGAL },
] as const;

export const STORAGE_PROVIDER_VALUE = {
  LOCAL: "local",
  SUPABASE: "supabase",
  S3: "s3",
} as const;

export type StorageProviderValue = (typeof STORAGE_PROVIDER_VALUE)[keyof typeof STORAGE_PROVIDER_VALUE];

export type DocumentStatus = keyof typeof DOCUMENT_STATUS_LABELS;
export type ArchiveCategory = keyof typeof ARCHIVE_CATEGORY_LABELS;
