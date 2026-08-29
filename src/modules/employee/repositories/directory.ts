/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient, type PrismaClientOrTx } from "./common";

export async function findEmployees(where: any, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { name: true } },
      workplace: { select: { name: true } },
      _count: { select: { documentRecords: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function findEmployeesForExport(where: any, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { name: true } },
      employeeGroup: { select: { name: true } },
      employeePosition: { select: { name: true } },
      employeeRank: { select: { name: true } },
      workplace: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function findEmployeesWithPagination(
  where: any,
  skip: number,
  take: number,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  tx?: PrismaClientOrTx
) {
  let orderBy: any = { name: "asc" };

  if (sortBy && sortOrder) {
    if (sortBy === "name") {
      orderBy = { name: sortOrder };
    } else if (sortBy === "workplace") {
      orderBy = { workplace: { name: sortOrder } };
    } else if (sortBy === "documentCount") {
      orderBy = { documentRecords: { _count: sortOrder } };
    }
    // Ignore invalid sortBy values - keep default ordering
  }

  return getClient(tx).employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { name: true } },
      employeeRank: { select: { name: true, rankName: true, grade: true } },
      workplace: { select: { name: true } },
      _count: { select: { documentRecords: true } },
    },
    orderBy,
    skip,
    take,
  });
}

export async function countEmployees(where: any, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.count({ where });
}

export async function findEmployeeSignatureOptions(tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      employeeId: true,
      employeePosition: { select: { name: true } },
      employeeRank: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}
