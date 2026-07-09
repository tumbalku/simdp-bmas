/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export async function getDashboardStats(filter: { workplaceId?: string }) {
  // 1. Fetch active employees matching filter
  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      workplaceId: filter.workplaceId || undefined,
    },
    include: {
      documentRecords: {
        where: {
          status: "APPROVED",
          deletedAt: null,
        },
        select: {
          documentTypeId: true,
        },
      },
    },
  });

  // 2. Fetch mandatory document types
  const mandatoryTypes = await prisma.documentType.findMany({
    where: {
      isMandatory: true,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  // Calculate compliance count
  let compliantEmployeesCount = 0;
  for (const emp of employees) {
    const approvedTypes = new Set(emp.documentRecords.map((r) => r.documentTypeId));
    const isCompliant = mandatoryTypes.every((t) => approvedTypes.has(t.id));
    if (isCompliant) compliantEmployeesCount++;
  }

  const complianceRate =
    employees.length > 0 ? parseFloat(((compliantEmployeesCount / employees.length) * 100).toFixed(1)) : 100.0;

  // 3. Count documents by status
  const docsStatusCount = await prisma.documentRecord.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
      owner: filter.workplaceId
        ? {
            workplaceId: filter.workplaceId,
            deletedAt: null,
          }
        : {
            deletedAt: null,
          },
    },
    _count: {
      _all: true,
    },
  });

  const documentsByStatus = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    EXPIRED: 0,
    REPLACED: 0,
  };

  docsStatusCount.forEach((group) => {
    if (group.status in documentsByStatus) {
      (documentsByStatus as any)[group.status] = group._count._all;
    }
  });

  // 4. Count documents by category
  const docsList = await prisma.documentRecord.findMany({
    where: {
      deletedAt: null,
      owner: filter.workplaceId
        ? {
            workplaceId: filter.workplaceId,
            deletedAt: null,
          }
        : {
            deletedAt: null,
          },
    },
    select: {
      documentType: {
        select: {
          archiveCategory: true,
        },
      },
    },
  });

  const documentsByCategory = {
    PERSONAL: 0,
    EDUCATION: 0,
    EMPLOYMENT: 0,
    CERTIFICATION: 0,
    LEGAL: 0,
  };

  docsList.forEach((d) => {
    if (d.documentType?.archiveCategory && d.documentType.archiveCategory in documentsByCategory) {
      (documentsByCategory as any)[d.documentType.archiveCategory]++;
    }
  });

  return {
    totalEmployees: employees.length,
    compliantEmployeesCount,
    complianceRate,
    documentsByStatus,
    documentsByCategory,
  };
}
