import crypto from "crypto";

import { Prisma } from "@prisma/client";
import QRCode from "qrcode";

import { env } from "@/lib/env";

import * as repository from "./repository";
import {
  DOCUMENT_VERIFICATION_TYPE,
  type IssuedDocumentVerification,
  type PublicDocumentVerificationResult,
} from "./types";

const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_VERIFICATION_TYPE.EMPLOYEE_PROFILE]: "Profil Pegawai",
} as const;

function generateVerificationCode() {
  return `SIMDP-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
}

function buildVerifyUrl(code: string) {
  const url = new URL("/verify-document", env.NEXT_PUBLIC_APP_URL);
  url.searchParams.set("code", code);
  return url.toString();
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function maskIdentifier(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 6) return value;
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

function getVerificationStatus(
  verification: Awaited<ReturnType<typeof repository.findDocumentVerificationByCode>>
): PublicDocumentVerificationResult["status"] {
  if (!verification) return "NOT_FOUND";
  if (verification.revokedAt) return "REVOKED";
  if (verification.expiresAt && verification.expiresAt.getTime() <= Date.now()) return "EXPIRED";
  return "VALID";
}

export async function issueEmployeeProfileVerification(input: {
  employeeId: string;
  issuedByUserId: string;
  metadata?: Prisma.InputJsonObject;
}): Promise<IssuedDocumentVerification> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomUUID();
    const code = generateVerificationCode();

    try {
      const verification = await repository.createDocumentVerification({
        id,
        code,
        documentType: DOCUMENT_VERIFICATION_TYPE.EMPLOYEE_PROFILE,
        subjectEmployeeId: input.employeeId,
        issuedByUserId: input.issuedByUserId,
        metadata: input.metadata,
      });
      const verifyUrl = buildVerifyUrl(verification.code);
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 148,
      });

      return {
        id: verification.id,
        code: verification.code,
        verifyUrl,
        qrCodeDataUrl,
      };
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 4) continue;
      throw error;
    }
  }

  throw new Error("Gagal membuat kode verifikasi dokumen.");
}

export async function attachDocumentVerificationFileHash(id: string, fileHash: string) {
  await repository.updateDocumentVerificationFileHash(id, fileHash);
}

export async function verifyDocumentCode(code: string): Promise<PublicDocumentVerificationResult> {
  const normalizedCode = code.trim().toUpperCase();
  const verification = await repository.findDocumentVerificationByCode(normalizedCode);

  if (!verification) {
    return {
      code: normalizedCode,
      status: "NOT_FOUND",
      documentTypeLabel: null,
      subjectName: null,
      subjectIdentifier: null,
      workplace: null,
      employeePosition: null,
      issuedAt: null,
      expiresAt: null,
      revokedAt: null,
      fileHash: null,
    };
  }

  return {
    code: verification.code,
    status: getVerificationStatus(verification),
    documentTypeLabel: DOCUMENT_TYPE_LABELS[verification.documentType],
    subjectName: verification.subjectEmployee.name,
    subjectIdentifier: maskIdentifier(verification.subjectEmployee.employeeId || verification.subjectEmployee.nik),
    workplace: verification.subjectEmployee.workplace?.name ?? null,
    employeePosition: verification.subjectEmployee.employeePosition?.name ?? null,
    issuedAt: toIsoString(verification.issuedAt),
    expiresAt: toIsoString(verification.expiresAt),
    revokedAt: toIsoString(verification.revokedAt),
    fileHash: verification.fileHash,
  };
}
