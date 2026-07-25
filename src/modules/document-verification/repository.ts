import type { DocumentVerificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateDocumentVerificationInput = {
  id: string;
  code: string;
  documentType: DocumentVerificationType;
  subjectEmployeeId: string;
  issuedByUserId?: string | null;
  metadata?: Prisma.InputJsonObject;
  expiresAt?: Date | null;
};

export async function createDocumentVerification(input: CreateDocumentVerificationInput) {
  return prisma.documentVerification.create({
    data: {
      id: input.id,
      code: input.code,
      documentType: input.documentType,
      subjectEmployeeId: input.subjectEmployeeId,
      issuedByUserId: input.issuedByUserId ?? null,
      metadata: input.metadata,
      expiresAt: input.expiresAt ?? null,
    },
  });
}

export async function updateDocumentVerificationFileHash(id: string, fileHash: string) {
  return prisma.documentVerification.update({
    where: { id },
    data: { fileHash },
  });
}

export async function findDocumentVerificationByCode(code: string) {
  return prisma.documentVerification.findUnique({
    where: { code },
    include: {
      subjectEmployee: {
        select: {
          id: true,
          employeeId: true,
          nik: true,
          name: true,
          employeePosition: { select: { name: true } },
          workplace: { select: { name: true } },
        },
      },
    },
  });
}
