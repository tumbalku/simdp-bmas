/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { getClient, type PrismaClientOrTx } from "./common";

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

async function nullifyCreatedUpdatedBy(delegate: any, userId: string) {
  await delegate.updateMany({
    where: { createdBy: userId },
    data: { createdBy: null },
  });
  await delegate.updateMany({
    where: { updatedBy: userId },
    data: { updatedBy: null },
  });
}

export async function permanentlyDeleteEmployeeAndUser(employeeId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await nullifyCreatedUpdatedBy(tx.employmentStatus, userId);
    await nullifyCreatedUpdatedBy(tx.employeeGroup, userId);
    await nullifyCreatedUpdatedBy(tx.professionGroup, userId);
    await nullifyCreatedUpdatedBy(tx.employeePosition, userId);
    await nullifyCreatedUpdatedBy(tx.employeeRank, userId);
    await nullifyCreatedUpdatedBy(tx.workplace, userId);
    await nullifyCreatedUpdatedBy(tx.employee, userId);
    await tx.employeeCareerHistory.updateMany({
      where: { createdBy: userId },
      data: { createdBy: null },
    });
    await nullifyCreatedUpdatedBy(tx.documentType, userId);
    await nullifyCreatedUpdatedBy(tx.documentRecord, userId);
    await tx.verificationHistory.updateMany({
      where: { reviewedById: userId },
      data: { reviewedById: null },
    });
    await tx.securityLog.updateMany({
      where: { actorId: userId },
      data: { actorId: null },
    });
    await tx.systemSetting.updateMany({
      where: { updatedBy: userId },
      data: { updatedBy: null },
    });

    await tx.employee.delete({ where: { id: employeeId } });
    await tx.user.delete({ where: { id: userId } });
  });
}

export async function createCareerHistoryAndUpdateCurrent(data: {
  history: any;
  currentAssignment: any;
}) {
  return prisma.$transaction(async (tx) => {
    const history = await createCareerHistory(data.history, tx);
    const newestHistory = await findNewestCareerHistory(data.history.employeeId, tx);

    if (newestHistory && newestHistory.id === history.id && Object.keys(data.currentAssignment).length > 0) {
      await updateEmployee(data.history.employeeId, data.currentAssignment, tx);
    }

    return history;
  });
}
