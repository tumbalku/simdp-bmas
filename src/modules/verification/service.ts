/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logActivity } from "@/modules/security/service";
import { TokenPayload } from "@/lib/auth";

export async function getVerificationQueue(filter: {
  page?: number;
  pageSize?: number;
  search?: string;
  documentTypeId?: string;
  workplaceId?: string;
}) {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 15;

  const where: any = {
    status: "PENDING",
    deletedAt: null,
  };

  if (filter.documentTypeId) {
    where.documentTypeId = filter.documentTypeId;
  }

  if (filter.workplaceId || filter.search) {
    where.owner = {};
    if (filter.workplaceId) {
      where.owner.workplaceId = filter.workplaceId;
    }
    if (filter.search) {
      where.owner.name = {
        contains: filter.search,
        mode: "insensitive",
      };
    }
  }

  const [items, totalItems] = await prisma.$transaction([
    prisma.documentRecord.findMany({
      where,
      include: {
        owner: {
          include: { workplace: true },
        },
        documentType: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.documentRecord.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  const mappedData = items.map((doc) => ({
    id: doc.id,
    owner: {
      id: doc.owner.id,
      name: doc.owner.name,
      workplace: doc.owner.workplace?.name || null,
    },
    documentType: {
      id: doc.documentType.id,
      name: doc.documentType.name,
    },
    title: doc.title,
    documentNumber: doc.documentNumber,
    uploadedAt: doc.uploadedAt.toISOString(),
  }));

  return {
    data: mappedData,
    meta: {
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  };
}

export async function verifyDocument(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note: string | undefined,
  reviewerId: string,
  reviewerName: string,
  reviewerRole: string
) {
  // Find document record
  const doc = await prisma.documentRecord.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: true,
      documentType: true,
    },
  });

  if (!doc) throw new Error("Dokumen tidak ditemukan atau sudah dihapus");

  if (decision === "REJECTED" && (!note || note.trim().length < 5)) {
    throw new Error("Catatan penolakan (note) wajib diisi minimal 5 karakter.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update DocumentRecord status
    const updatedDoc = await tx.documentRecord.update({
      where: { id },
      data: { status: decision, updatedAt: new Date() },
    });

    // 2. Add VerificationHistory record
    await tx.verificationHistory.create({
      data: {
        id: crypto.randomUUID(),
        documentRecordId: id,
        status: decision,
        reviewedById: reviewerId,
        reviewNote: note || null,
        reviewedAt: new Date(),
      },
    });

    // 3. Send notification to the document owner
    await tx.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: doc.owner.userId,
        type: "DOCUMENT_STATUS",
        title: decision === "APPROVED" ? "Dokumen Disetujui" : "Dokumen Ditolak",
        message: `Dokumen ${doc.documentType.name} Anda telah ${
          decision === "APPROVED" ? "disetujui" : "ditolak"
        }.${note ? ` Catatan: ${note}` : ""}`,
        relatedEntityType: "DocumentRecord",
        relatedEntityId: id,
      },
    });

    return updatedDoc;
  });

  await logActivity({
    actorId: reviewerId,
    actorName: reviewerName,
    actorRole: reviewerRole,
    eventType: decision === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED",
    resource: `DocumentRecord:${id}`,
    status: "SUCCESS",
    metadata: { reviewNote: note },
  });

  return {
    id: result.id,
    status: result.status,
  };
}

export async function getVerificationHistory(documentId: string, session: TokenPayload) {
  const doc = await prisma.documentRecord.findUnique({
    where: { id: documentId, deletedAt: null },
    include: { owner: true },
  });

  if (!doc) throw new Error("Dokumen tidak ditemukan");

  // Enforce ownership
  if (session.role === "EMPLOYEE") {
    if (doc.owner.userId !== session.userId) {
      throw new Error("OWNERSHIP_REQUIRED");
    }
  }

  const histories = await prisma.verificationHistory.findMany({
    where: { documentRecordId: documentId },
    include: {
      reviewedBy: {
        include: { employee: true },
      },
    },
    orderBy: { reviewedAt: "desc" },
  });

  return histories.map((vh) => ({
    id: vh.id,
    status: vh.status,
    reviewNote: vh.reviewNote,
    reviewedAt: vh.reviewedAt.toISOString(),
    reviewedBy: vh.reviewedBy
      ? {
          name: vh.reviewedBy.employee?.name || vh.reviewedBy.email,
        }
      : { name: "System" },
  }));
}
