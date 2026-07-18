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
  tx?: PrismaClientOrTx
) {
  return getClient(tx).employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { name: true } },
      workplace: { select: { name: true } },
      _count: { select: { documentRecords: true } },
    },
    orderBy: { name: "asc" },
    skip,
    take,
  });
}

export async function countEmployees(where: any, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.count({ where });
}
