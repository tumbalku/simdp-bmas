/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { PaginationMeta } from "@/types/pagination";
import { mapDocumentRecord, mapDocumentDetail } from "../mappers";
import * as repo from "../repository";
import type { DocumentListFilter } from "./shared";

export async function getDocumentRecordsForSession(session: TokenPayload, filter: DocumentListFilter = {}) {
  const where: any = { deletedAt: filter.archiveView === "archived" ? { not: null } : null };

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.documentTypeId) {
    where.documentTypeId = filter.documentTypeId;
  }

  if (filter.archiveCategory) {
    where.documentType = {
      archiveCategory: filter.archiveCategory,
    };
  }

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { fileName: { contains: filter.search, mode: "insensitive" } },
      { documentType: { name: { contains: filter.search, mode: "insensitive" } } },
      { owner: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const employee = await repo.findEmployeeByUserId(session.userId);
  if (!employee) return [];
  where.ownerId = employee.id;

  const records = await repo.findDocumentRecords(where);
  return records.map(mapDocumentRecord);
}

export async function getDocumentRecordsWithPagination(
  filter: DocumentListFilter & { page?: number; limit?: number } = {}
): Promise<{ data: ReturnType<typeof mapDocumentRecord>[]; pagination: PaginationMeta }> {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: filter.archiveView === "archived" ? { not: null } : null };

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.documentTypeId) {
    where.documentTypeId = filter.documentTypeId;
  }

  if (filter.archiveCategory) {
    where.documentType = {
      archiveCategory: filter.archiveCategory,
    };
  }

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { fileName: { contains: filter.search, mode: "insensitive" } },
      { documentType: { name: { contains: filter.search, mode: "insensitive" } } },
      { owner: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const [records, total] = await repo.findDocumentRecordsWithPagination(
    where,
    skip,
    limit,
    filter.sortBy,
    filter.sortOrder
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data: records.map(mapDocumentRecord),
    pagination: {
      page,
      pageSize: limit,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getDocumentRecordDetailForSession(documentId: string, session: TokenPayload) {
  const record = await repo.findDocumentRecordDetailById(documentId);

  if (!record) throw new AppError("NOT_FOUND", "Dokumen tidak ditemukan", 404);
  if (session.role === "EMPLOYEE" && record.owner.userId !== session.userId) {
    throw new AppError("OWNERSHIP_REQUIRED", "OWNERSHIP_REQUIRED", 403);
  }

  return mapDocumentDetail(record);
}
