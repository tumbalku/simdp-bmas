export const DOCUMENT_VERIFICATION_TYPE = {
  EMPLOYEE_PROFILE: "EMPLOYEE_PROFILE",
  EMPLOYEE_DIRECTORY: "EMPLOYEE_DIRECTORY",
} as const;

export type DocumentVerificationType =
  (typeof DOCUMENT_VERIFICATION_TYPE)[keyof typeof DOCUMENT_VERIFICATION_TYPE];

export type PublicDocumentVerificationStatus = "VALID" | "EXPIRED" | "REVOKED" | "NOT_FOUND";

export type PublicDocumentVerificationResult = {
  code: string;
  status: PublicDocumentVerificationStatus;
  documentTypeLabel: string | null;
  subjectName: string | null;
  subjectIdentifier: string | null;
  workplace: string | null;
  employeePosition: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  fileHash: string | null;
};

export type IssuedDocumentVerification = {
  id: string;
  code: string;
  verifyUrl: string;
  qrCodeDataUrl: string;
};
