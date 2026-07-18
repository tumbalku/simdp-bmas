/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "./common";

export async function findEmployeeByUserId(userId: string) {
  return prisma.employee.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true, userId: true },
  });
}

export async function findEmployeeByUserIdUnique(userId: string) {
  return prisma.employee.findUnique({
    where: { userId, deletedAt: null } as any,
  });
}

export async function findDocumentRecords(where: any) {
  return prisma.documentRecord.findMany({
    where,
    include: {
      documentType: { select: { id: true, name: true, archiveCategory: true } },
      owner: { select: { id: true, name: true, employeeId: true, nik: true } },
    },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function findDocumentRecordsWithPagination(where: any, skip: number, limit: number) {
  return Promise.all([
    prisma.documentRecord.findMany({
      where,
      include: {
        documentType: { select: { id: true, name: true, archiveCategory: true } },
        owner: { select: { id: true, name: true, employeeId: true, nik: true } },
      },
      orderBy: { uploadedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.documentRecord.count({ where }),
  ]);
}

export async function findDocumentRecordDetailById(documentId: string) {
  return prisma.documentRecord.findUnique({
    where: { id: documentId, deletedAt: null },
    include: {
      documentType: { select: { id: true, name: true, archiveCategory: true, code: true, description: true } },
      owner: { select: { id: true, userId: true, name: true, employeeId: true, nik: true } },
      verificationHistories: {
        orderBy: { reviewedAt: "desc" },
        include: { reviewedBy: { select: { email: true, employee: { select: { name: true } } } } },
      },
    },
  });
}


