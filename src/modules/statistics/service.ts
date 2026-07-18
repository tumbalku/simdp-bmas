/* eslint-disable @typescript-eslint/no-explicit-any */
import { matchesDocumentTypeTarget } from "@/modules/document/target-rules";
import {
  countEmployeeDocumentsByStatus,
  findApprovedVerificationHistoriesSince,
  findDashboardDocumentRecords,
  findDashboardEmployees,
  findExpiringEmployeeDocuments,
  findMandatoryDocumentTypesForStatistics,
  findRecentEmployeeUploads,
  findUserWithEmployeeById,
  getStatisticsChartsData as getStatsChartsRepo,
  groupDocumentRecordsByStatus,
} from "./repository";

export async function getDashboardStats(filter: { workplaceId?: string }) {
  // 1. Fetch active employees matching filter
  const employees = await findDashboardEmployees(filter);

  // 2. Fetch mandatory document types
  const mandatoryTypes = await findMandatoryDocumentTypesForStatistics();

  // Calculate compliance count
  let compliantEmployeesCount = 0;
  for (const emp of employees) {
    const approvedTypes = new Set(emp.documentRecords.map((r) => r.documentTypeId));
    const applicableMandatoryTypes = mandatoryTypes.filter((type) =>
      matchesDocumentTypeTarget(emp, type)
    );
    const isCompliant = applicableMandatoryTypes.every((t) => approvedTypes.has(t.id));
    if (isCompliant) compliantEmployeesCount++;
  }

  const complianceRate =
    employees.length > 0 ? parseFloat(((compliantEmployeesCount / employees.length) * 100).toFixed(1)) : 100.0;

  // 3. Count documents by status
  const docsStatusCount = await groupDocumentRecordsByStatus(filter);

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

  // 4. Count documents by category & fetch upload dates for trend
  const docsList = await findDashboardDocumentRecords(filter);

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

  // 5. Aggregate Upload & Verification Trend (last 6 months)
  const now = new Date();
  const startOfPeriod = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const verifiedDocs = await findApprovedVerificationHistoriesSince({
    startOfPeriod,
    workplaceId: filter.workplaceId,
  });

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const uploadTrend: Array<{ month: string; Uploaded: number; Verified: number }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const monthName = MONTH_NAMES[monthIndex];

    const uploadedInMonth = docsList.filter((doc) => {
      const docDate = doc.uploadedAt;
      return (
        docDate &&
        docDate.getFullYear() === year &&
        docDate.getMonth() === monthIndex
      );
    }).length;

    const verifiedInMonth = verifiedDocs.filter((vh) => {
      const vhDate = vh.reviewedAt;
      return vhDate.getFullYear() === year && vhDate.getMonth() === monthIndex;
    }).length;

    uploadTrend.push({
      month: monthName,
      Uploaded: uploadedInMonth,
      Verified: verifiedInMonth,
    });
  }

  return {
    totalEmployees: employees.length,
    compliantEmployeesCount,
    complianceRate,
    documentsByStatus,
    documentsByCategory,
    uploadTrend,
  };
}

export async function getEmployeeStats(userId: string) {
  // Get employee profile
  const user = await findUserWithEmployeeById(userId);

  if (!user || !user.employee) {
    return {
      totalSubmitted: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      expiringCount: 0,
      recentUploads: [],
      expiringDocuments: [],
    };
  }

  const employeeId = user.employee.id;
  const now = new Date();

  // Count by status type-safely
  const pendingCount = await countEmployeeDocumentsByStatus({ employeeId, status: "PENDING" });
  const approvedCount = await countEmployeeDocumentsByStatus({ employeeId, status: "APPROVED" });
  const rejectedCount = await countEmployeeDocumentsByStatus({ employeeId, status: "REJECTED" });
  const expiredCount = await countEmployeeDocumentsByStatus({ employeeId, status: "EXPIRED" });

  const totalSubmitted = await countEmployeeDocumentsByStatus({ employeeId });

  // Expiring in 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringDocuments = await findExpiringEmployeeDocuments({
    employeeId,
    now,
    until: thirtyDaysFromNow,
  });

  // Recent uploads
  const recentUploads = await findRecentEmployeeUploads(employeeId);

  return {
    totalSubmitted,
    approvedCount,
    pendingCount,
    rejectedCount,
    expiredCount,
    expiringCount: expiringDocuments.length,
    recentUploads: recentUploads.map((d) => ({
      id: d.id,
      documentName: d.documentType?.name || "Dokumen",
      category: d.documentType?.archiveCategory || "PERSONAL",
      status: d.status,
      uploadedAt: d.uploadedAt.toISOString(),
      expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
    })),
    expiringDocuments: expiringDocuments.map((d) => ({
      id: d.id,
      documentName: d.documentType?.name || "Dokumen",
      expiryDate: d.expiryDate!.toISOString(),
      daysRemaining: Math.ceil((d.expiryDate!.getTime() - now.getTime()) / 86_400_000),
    })),
  };
}

export async function getStatisticsChartsData() {
  return getStatsChartsRepo();
}
