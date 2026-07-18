import { DOCUMENT_STATUS_LABELS, type DocumentStatus } from "@/modules/document";

export const VERIFICATION_STATUS_LABELS = DOCUMENT_STATUS_LABELS;

export const VERIFICATION_DECISIONS = {
  approve: "APPROVED",
  reject: "REJECTED",
} as const;

export type VerificationStatus = DocumentStatus;
export type VerificationDecision = (typeof VERIFICATION_DECISIONS)[keyof typeof VERIFICATION_DECISIONS];
