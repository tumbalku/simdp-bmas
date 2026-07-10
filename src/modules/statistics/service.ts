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

export async function getEmployeeStats(userId: string) {
  // Get employee profile
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { employee: true },
  });

  if (!user || !user.employee) {
    return {
      totalSubmitted: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      expiringCount: 0,
      recentUploads: [],
    };
  }

  const employeeId = user.employee.id;

  // Count by status type-safely
  const pendingCount = await prisma.documentRecord.count({
    where: { ownerId: employeeId, status: "PENDING", deletedAt: null },
  });
  const approvedCount = await prisma.documentRecord.count({
    where: { ownerId: employeeId, status: "APPROVED", deletedAt: null },
  });
  const rejectedCount = await prisma.documentRecord.count({
    where: { ownerId: employeeId, status: "REJECTED", deletedAt: null },
  });
  const expiredCount = await prisma.documentRecord.count({
    where: { ownerId: employeeId, status: "EXPIRED", deletedAt: null },
  });

  const totalSubmitted = await prisma.documentRecord.count({
    where: { ownerId: employeeId, deletedAt: null },
  });

  // Expiring in 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringCount = await prisma.documentRecord.count({
    where: {
      ownerId: employeeId,
      deletedAt: null,
      status: "APPROVED",
      expiryDate: {
        gt: new Date(),
        lte: thirtyDaysFromNow,
      },
    },
  });

  // Recent uploads
  const recentUploads = await prisma.documentRecord.findMany({
    where: { ownerId: employeeId, deletedAt: null },
    orderBy: { uploadedAt: "desc" },
    take: 5,
    include: {
      documentType: {
        select: {
          name: true,
          archiveCategory: true,
        },
      },
    },
  });

  return {
    totalSubmitted,
    approvedCount,
    pendingCount,
    rejectedCount,
    expiredCount,
    expiringCount,
    recentUploads: recentUploads.map((d) => ({
      id: d.id,
      documentName: d.documentType?.name || "Dokumen",
      category: d.documentType?.archiveCategory || "PERSONAL",
      status: d.status,
      uploadedAt: d.uploadedAt.toISOString(),
      expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
    })),
  };
}
