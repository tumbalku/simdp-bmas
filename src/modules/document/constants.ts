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

export type DocumentStatus = keyof typeof DOCUMENT_STATUS_LABELS;
