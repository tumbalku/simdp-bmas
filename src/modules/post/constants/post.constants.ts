export const POST_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Dipublikasikan",
  ARCHIVED: "Diarsipkan",
};

export const POST_VISIBILITY_TYPE = {
  PUBLIC: "PUBLIC",
  TARGETED: "TARGETED",
} as const;

export type PostVisibilityType = (typeof POST_VISIBILITY_TYPE)[keyof typeof POST_VISIBILITY_TYPE];

export const POST_VISIBILITY_TYPE_LABELS: Record<PostVisibilityType, string> = {
  PUBLIC: "Semua User",
  TARGETED: "Target Tertentu",
};

export const POST_STATUS_OPTIONS = Object.values(POST_STATUS).map((value) => ({
  value,
  label: POST_STATUS_LABELS[value],
}));

export const POST_VISIBILITY_TYPE_OPTIONS = Object.values(POST_VISIBILITY_TYPE).map((value) => ({
  value,
  label: POST_VISIBILITY_TYPE_LABELS[value],
}));

export const DEFAULT_POST_ATTACHMENT_LIMITS = {
  maxFiles: 5,
  maxFileSizeMb: 10,
} as const;

export const POST_ATTACHMENT_SETTING_KEYS = {
  maxFiles: "announcement_attachment_max_files",
  maxFileSizeMb: "announcement_attachment_max_file_mb",
} as const;

export type PostAttachmentLimits = {
  maxFiles: number;
  maxFileSizeMb: number;
};
