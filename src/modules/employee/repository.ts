/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type PrismaClientOrTx = Prisma.TransactionClient | typeof prisma;

function getClient(tx?: PrismaClientOrTx): PrismaClientOrTx {
  return tx || prisma;
}

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

export async function findEmployeeDetailById(id: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findUnique({
    where: { id, deletedAt: null },
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { name: true } },
      employeeGroup: { select: { name: true } },
      employeePosition: { select: { name: true } },
      employeeRank: { select: { name: true } },
      workplace: { select: { name: true } },
      careerHistories: {
        orderBy: { effectiveDate: "desc" },
        include: {
          employmentStatus: { select: { name: true } },
          employeeGroup: { select: { name: true } },
          employeePosition: { select: { name: true } },
          employeeRank: { select: { name: true } },
          workplace: { select: { name: true } },
        },
      },
      documentRecords: {
        where: { deletedAt: null },
        orderBy: { uploadedAt: "desc" },
        include: { documentType: { select: { name: true, archiveCategory: true } } },
      },
    },
  });
}

export async function findEmployeeByUserId(userId: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findFirst({
    where: { userId, deletedAt: null },
    include: {
      employmentStatus: true,
      employeeGroup: true,
      employeePosition: true,
      employeeRank: true,
      workplace: true,
    },
  });
}

export async function findUserWithEmployeeById(userId: string, tx?: PrismaClientOrTx) {
  return getClient(tx).user.findFirst({
    where: { id: userId },
    include: { employee: true },
  });
}

export async function findEmployeeSimpleByUserId(userId: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findFirst({
    where: { userId, deletedAt: null },
  });
}

export async function findUserByEmail(email: string, tx?: PrismaClientOrTx) {
  return getClient(tx).user.findFirst({ where: { email } });
}

export async function findEmployeeByEmployeeId(employeeId: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findFirst({ where: { employeeId } });
}

export async function findEmployeeByNik(nik: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findFirst({ where: { nik } });
}

export async function createEmployee(data: any, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.create({ data });
}

export async function updateEmployee(id: string, data: any, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.update({
    where: { id },
    data,
  });
}

export async function createUser(data: any, tx?: PrismaClientOrTx) {
  return getClient(tx).user.create({ data });
}

export async function updateUser(id: string, data: any, tx?: PrismaClientOrTx) {
  return getClient(tx).user.update({
    where: { id },
    data,
  });
}

export async function findEmployeeById(id: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findUnique({
    where: { id },
  });
}

export async function findEmployeeWithUserById(id: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findUnique({
    where: { id },
    include: { user: true },
  });
}

export async function createCareerHistory(data: any, tx?: PrismaClientOrTx) {
  return getClient(tx).employeeCareerHistory.create({ data });
}

export async function findNewestCareerHistory(employeeId: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employeeCareerHistory.findFirst({
    where: { employeeId },
    orderBy: { effectiveDate: "desc" },
  });
}

export async function createEmployeeWithUserTransaction(data: { user: any; employee: any }) {
  return prisma.$transaction(async (tx) => {
    const user = await createUser(data.user, tx);
    const employee = await createEmployee(data.employee, tx);

    return { user, employee };
  });
}

export async function updateEmployeeWithUserTransaction(data: {
  id: string;
  userId: string;
  user?: any;
  employee: any;
}) {
  return prisma.$transaction(async (tx) => {
    if (data.user) {
      await updateUser(data.userId, data.user, tx);
    }

    return updateEmployee(data.id, data.employee, tx);
  });
}

export async function softDeleteEmployeeAndUser(employeeId: string, userId: string) {
  const deletedAt = new Date();

  return prisma.$transaction(async (tx) => {
    await updateEmployee(employeeId, { deletedAt }, tx);
    await updateUser(userId, { deletedAt }, tx);
  });
}

export async function restoreEmployeeAndUser(employeeId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await updateEmployee(employeeId, { deletedAt: null }, tx);
    await updateUser(userId, { deletedAt: null }, tx);
  });
}

export async function createCareerHistoryAndUpdateCurrent(data: {
  history: any;
  currentAssignment: any;
}) {
  return prisma.$transaction(async (tx) => {
    const history = await createCareerHistory(data.history, tx);
    const newestHistory = await findNewestCareerHistory(data.history.employeeId, tx);

    if (newestHistory && newestHistory.id === data.history.id) {
      await updateEmployee(data.history.employeeId, data.currentAssignment, tx);
    }

    return history;
  });
}

export async function findMasterDataMany(
  modelName: string,
  query: { where: any; include?: any; orderBy?: any; skip?: number; take?: number },
  tx?: PrismaClientOrTx
) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.findMany(query);
}

export async function countMasterData(modelName: string, query: { where: any }, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.count(query);
}

export async function createMasterData(modelName: string, data: any, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.create({ data });
}

export async function updateMasterData(modelName: string, id: string, data: any, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.update({
    where: { id },
    data,
  });
}

export async function deleteMasterData(modelName: string, id: string, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.delete({
    where: { id },
  });
}
