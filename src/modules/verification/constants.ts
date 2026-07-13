export const VERIFICATION_STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  REPLACED: "Diganti",
} as const;

export const VERIFICATION_DECISIONS = {
  approve: "APPROVED",
  reject: "REJECTED",
} as const;

export type VerificationStatus = keyof typeof VERIFICATION_STATUS_LABELS;
export type VerificationDecision = (typeof VERIFICATION_DECISIONS)[keyof typeof VERIFICATION_DECISIONS];
