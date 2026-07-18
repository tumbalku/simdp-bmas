/* eslint-disable @typescript-eslint/no-explicit-any */
import { matchesDocumentTypeTarget } from "@/modules/document/target-rules";
import {
  findApprovedVerificationHistoriesSince,
  findDashboardDocumentRecords,
  findDashboardEmployees,
  findMandatoryDocumentTypesForStatistics,
  groupDocumentRecordsByStatus,
} from "../repository";

export async function getDashboardStats(filter: { workplaceId?: string }) {
  const employees = await findDashboardEmployees(filter);
  const mandatoryTypes = await findMandatoryDocumentTypesForStatistics();

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
