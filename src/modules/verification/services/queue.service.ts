/* eslint-disable @typescript-eslint/no-explicit-any */
import { PAGINATION } from "@/constants/pagination";
import * as repo from "../repositories/common";

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

  const [items, totalItems] = await repo.findPendingDocumentsWithCount({
    where,
    page,
    pageSize,
  });

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
