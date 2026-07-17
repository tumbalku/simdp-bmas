/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logActivity } from "@/modules/security/service";
import { TokenPayload } from "@/lib/auth";
import { PAGINATION } from "@/constants/pagination";
import { bigIntToNumber } from "@/lib/utils";
import { NOTIFICATION_RELATED_ENTITY_TYPE, NOTIFICATION_TYPE } from "@/modules/notification/constants";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/constants";

export async function getVerificationQueue(filter: {
  page?: number;
  pageSize?: number;
  search?: string;
  documentTypeId?: string;
  workplaceId?: string;
}) {
  const page = filter.page || PAGINATION.defaultPage;
  const pageSize = filter.pageSize || PAGINATION.defaultPageSize;

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
      employeeId: doc.owner.employeeId || null,
      nik: doc.owner.nik || null,
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

    return updatedDoc;
  });

  // 3. Send notification to the document owner via the notification service boundary
  const { createNotification } = await import("@/modules/notification/service");
  await createNotification({
    userId: doc.owner.userId,
    type: NOTIFICATION_TYPE.DOCUMENT_STATUS,
    title: decision === "APPROVED" ? "Dokumen Disetujui" : "Dokumen Ditolak",
    message: `Dokumen ${doc.documentType.name} Anda telah ${
      decision === "APPROVED" ? "disetujui" : "ditolak"
    }.${note ? ` Catatan: ${note}` : ""}`,
    relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD,
    relatedEntityId: id,
  });

  await logActivity({
    actorId: reviewerId,
    actorName: reviewerName,
    actorRole: reviewerRole,
    eventType:
      decision === "APPROVED" ? SECURITY_EVENT_TYPE.DOCUMENT_APPROVED : SECURITY_EVENT_TYPE.DOCUMENT_REJECTED,
    resource: `DocumentRecord:${id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
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

export async function getVerificationDocumentDetail(documentId: string, session: TokenPayload) {
  const record = await prisma.documentRecord.findUnique({
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

  if (!record) throw new Error("Dokumen tidak ditemukan");

  // Staff+ can view any; Employee only their own (but this route is STAFF+ only)
  if (session.role === "EMPLOYEE" && record.owner.userId !== session.userId) {
    throw new Error("FORBIDDEN");
  }

  return {
    id: record.id,
    title: record.title || record.documentType?.name || "Dokumen",
    status: record.status,
    uploadedAt: record.uploadedAt.toISOString(),
    expiryDate: record.expiryDate ? record.expiryDate.toISOString() : null,
    issueDate: record.issueDate ? record.issueDate.toISOString() : null,
    documentNumber: record.documentNumber,
    fileName: record.fileName,
    fileSize: bigIntToNumber(record.fileSize),
    mimeType: record.mimeType,
    documentTypeName: record.documentType?.name || "Jenis dokumen",
    archiveCategory: record.documentType?.archiveCategory || "PERSONAL",
    ownerName: record.owner?.name || "Pegawai",
    ownerEmployeeId: record.owner?.employeeId || null,
    ownerNik: record.owner?.nik || null,
    ownerWorkplace: record.owner?.workplace?.name || null,
    verificationHistories: record.verificationHistories.map((vh) => ({
      id: vh.id,
      status: vh.status,
      reviewNote: vh.reviewNote,
      reviewedAt: vh.reviewedAt.toISOString(),
      reviewerName: vh.reviewedBy?.employee?.name || vh.reviewedBy?.email || "Sistem",
    })),
  };
}
