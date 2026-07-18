import { prisma } from "@/lib/prisma";

export function findPendingDocumentsWithCount(input: {
  where: Record<string, unknown>;
  page: number;
  pageSize: number;
}) {
  return prisma.$transaction([
    prisma.documentRecord.findMany({
      where: input.where,
      include: {
        owner: {
          include: { workplace: true },
        },
        documentType: true,
      },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.documentRecord.count({ where: input.where }),
  ]);
}

export function findDocumentForVerification(id: string) {
  return prisma.documentRecord.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: true,
      documentType: true,
    },
  });
}

export function updateDocumentVerificationStatus(input: {
  id: string;
  status: "APPROVED" | "REJECTED";
  verificationHistoryId: string;
  reviewerId: string;
  reviewNote?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const updatedDoc = await tx.documentRecord.update({
      where: { id: input.id },
      data: { status: input.status, updatedAt: new Date() },
    });

    await tx.verificationHistory.create({
      data: {
        id: input.verificationHistoryId,
        documentRecordId: input.id,
        status: input.status,
        reviewedById: input.reviewerId,
        reviewNote: input.reviewNote || null,
        reviewedAt: new Date(),
      },
    });

    return updatedDoc;
  });
}

export function findDocumentWithOwner(documentId: string) {
  return prisma.documentRecord.findUnique({
    where: { id: documentId, deletedAt: null },
    include: { owner: true },
  });
}

export function findVerificationHistories(documentId: string) {
  return prisma.verificationHistory.findMany({
    where: { documentRecordId: documentId },
    include: {
      reviewedBy: {
        include: { employee: true },
      },
    },
    orderBy: { reviewedAt: "desc" },
  });
}

export function findVerificationDocumentDetail(documentId: string) {
  return prisma.documentRecord.findUnique({
    where: { id: documentId, deletedAt: null },
    include: {
      documentType: {
        select: { id: true, name: true, archiveCategory: true, code: true, description: true },
      },
      owner: {
        include: { workplace: true },
      },
      verificationHistories: {
        orderBy: { reviewedAt: "desc" },
        include: { reviewedBy: { select: { email: true, employee: { select: { name: true } } } } },
      },
    },
  });
}

export function findUserWithEmployeeById(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId },
    include: { employee: true },
  });
}
