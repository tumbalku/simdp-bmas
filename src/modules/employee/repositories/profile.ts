import { getClient, type PrismaClientOrTx } from "./common";

export async function findEmployeeDetailById(id: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findUnique({
    where: { id, deletedAt: null },
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { id: true, name: true } },
      employeeGroup: { select: { id: true, name: true, employmentStatusId: true } },
      employeePosition: { select: { id: true, name: true, professionGroupId: true } },
      employeeRank: { select: { id: true, name: true } },
      workplace: { select: { id: true, name: true } },
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
        include: { documentType: { select: { code: true, name: true, archiveCategory: true } } },
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
