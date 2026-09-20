export const REGISTRATION_STATUS = {
  EMAIL_PENDING: "EMAIL_PENDING",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUS)[keyof typeof REGISTRATION_STATUS];

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  EMAIL_PENDING: "Menunggu OTP email",
  EMAIL_VERIFIED: "Email terverifikasi",
  UNDER_REVIEW: "Menunggu persetujuan admin",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const REGISTRATION_OTP_LENGTH = 6;
export const REGISTRATION_OTP_TTL_MINUTES = 10;
export const REGISTRATION_OTP_MAX_ATTEMPTS = 5;
