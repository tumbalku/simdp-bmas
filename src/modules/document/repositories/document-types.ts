/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { prisma } from "./common";

export const documentTypeTargetInclude = {
  employmentStatuses: true,
  employeeGroups: true,
  employeePositions: true,
  professionGroups: true,
  employeeRanks: true,
  workplaces: true,
} as const;

export async function findManyAvailableDocumentTypes() {
  return prisma.documentType.findMany({
    where: { deletedAt: null },
    include: documentTypeTargetInclude,
    orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
  });
}

export async function findDocumentTypesWithPagination(where: any, skip: number, limit: number) {
  return Promise.all([
    prisma.documentType.findMany({
      where,
      include: {
        employmentStatuses: { include: { employmentStatus: { select: { name: true } } } },
        employeeGroups: { include: { employeeGroup: { select: { name: true } } } },
        employeePositions: { include: { employeePosition: { select: { name: true } } } },
        professionGroups: { include: { professionGroup: { select: { name: true } } } },
        employeeRanks: { include: { employeeRank: { select: { name: true } } } },
        workplaces: { include: { workplace: { select: { name: true } } } },
      },
      orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.documentType.count({ where }),
  ]);
}

export async function findDocumentTypeById(id: string) {
  return prisma.documentType.findUnique({
    where: { id },
    include: documentTypeTargetInclude,
  });
}

export async function findEmployeeTargetProfileByUserId(userId: string) {
  return prisma.employee.findUnique({
    where: { userId, deletedAt: null } as any,
    include: {
      employeePosition: { select: { professionGroupId: true } },
    },
  });
}

export async function createDocumentTypeWithRelations(
  id: string,
  insertData: any,
  relationIds: {
    professionGroupIds?: string[];
    employmentStatusIds?: string[];
    employeeGroupIds?: string[];
    employeePositionIds?: string[];
    employeeRankIds?: string[];
    workplaceIds?: string[];
  }
) {
  return prisma.$transaction(async (tx) => {
    const docType = await tx.documentType.create({
      data: insertData,
    });

    if (relationIds.professionGroupIds?.length) {
      await tx.documentTypeProfessionGroup.createMany({
        data: relationIds.professionGroupIds.map((pgId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          professionGroupId: pgId,
        })),
      });
    }
    if (relationIds.employmentStatusIds?.length) {
      await tx.documentTypeEmploymentStatus.createMany({
        data: relationIds.employmentStatusIds.map((esId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          employmentStatusId: esId,
        })),
      });
    }
    if (relationIds.employeeGroupIds?.length) {
      await tx.documentTypeEmployeeGroup.createMany({
        data: relationIds.employeeGroupIds.map((egId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          employeeGroupId: egId,
        })),
      });
    }
    if (relationIds.employeePositionIds?.length) {
      await tx.documentTypeEmployeePosition.createMany({
        data: relationIds.employeePositionIds.map((epId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          employeePositionId: epId,
        })),
      });
    }
    if (relationIds.employeeRankIds?.length) {
      await tx.documentTypeEmployeeRank.createMany({
        data: relationIds.employeeRankIds.map((erId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          employeeRankId: erId,
        })),
      });
    }
    if (relationIds.workplaceIds?.length) {
      await tx.documentTypeWorkplace.createMany({
        data: relationIds.workplaceIds.map((wpId) => ({
          id: crypto.randomUUID(),
          documentTypeId: id,
          workplaceId: wpId,
        })),
      });
    }

    return docType;
  });
}

export async function updateDocumentTypeWithRelations(
  id: string,
  updateData: any,
  relationIds: {
    professionGroupIds?: string[];
    employmentStatusIds?: string[];
    employeeGroupIds?: string[];
    employeePositionIds?: string[];
    employeeRankIds?: string[];
    workplaceIds?: string[];
  }
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.documentType.update({
      where: { id },
      data: updateData,
    });

    if (relationIds.professionGroupIds !== undefined) {
      await tx.documentTypeProfessionGroup.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.professionGroupIds.length) {
        await tx.documentTypeProfessionGroup.createMany({
          data: relationIds.professionGroupIds.map((pgId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            professionGroupId: pgId,
          })),
        });
      }
    }

    if (relationIds.employmentStatusIds !== undefined) {
      await tx.documentTypeEmploymentStatus.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.employmentStatusIds.length) {
        await tx.documentTypeEmploymentStatus.createMany({
          data: relationIds.employmentStatusIds.map((esId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            employmentStatusId: esId,
          })),
        });
      }
    }

    if (relationIds.employeeGroupIds !== undefined) {
      await tx.documentTypeEmployeeGroup.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.employeeGroupIds.length) {
        await tx.documentTypeEmployeeGroup.createMany({
          data: relationIds.employeeGroupIds.map((egId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            employeeGroupId: egId,
          })),
        });
      }
    }

    if (relationIds.employeePositionIds !== undefined) {
      await tx.documentTypeEmployeePosition.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.employeePositionIds.length) {
        await tx.documentTypeEmployeePosition.createMany({
          data: relationIds.employeePositionIds.map((epId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            employeePositionId: epId,
          })),
        });
      }
    }

    if (relationIds.employeeRankIds !== undefined) {
      await tx.documentTypeEmployeeRank.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.employeeRankIds.length) {
        await tx.documentTypeEmployeeRank.createMany({
          data: relationIds.employeeRankIds.map((erId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            employeeRankId: erId,
          })),
        });
      }
    }

    if (relationIds.workplaceIds !== undefined) {
      await tx.documentTypeWorkplace.deleteMany({ where: { documentTypeId: id } });
      if (relationIds.workplaceIds.length) {
        await tx.documentTypeWorkplace.createMany({
          data: relationIds.workplaceIds.map((wpId) => ({
            id: crypto.randomUUID(),
            documentTypeId: id,
            workplaceId: wpId,
          })),
        });
      }
    }

    return updated;
  });
}

export async function softDeleteDocumentType(id: string) {
  return prisma.documentType.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreDocumentType(id: string) {
  return prisma.documentType.update({
    where: { id },
    data: { deletedAt: null },
  });
}
