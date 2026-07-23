import {
  countEmployeeDocumentsByStatus,
  findExpiringEmployeeDocuments,
  findEmployeeDocumentTypeIds,
  findEmployeeTargetProfileForStatistics,
  findMandatoryDocumentTypesForStatistics,
  findRecentEmployeeUploads,
} from "../repository";
import { calculateMandatoryDocumentCompleteness } from "@/modules/document";

export async function getEmployeeStats(userId: string) {
  const employee = await findEmployeeTargetProfileForStatistics(userId);

  if (!employee) {
    return {
      totalSubmitted: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      expiringCount: 0,
      recentUploads: [],
      expiringDocuments: [],
      mandatoryDocumentCompleted: 0,
      mandatoryDocumentTotal: 0,
    };
  }

  const employeeId = employee.id;
  const now = new Date();

  const [mandatoryDocumentTypes, employeeDocumentTypeIds] = await Promise.all([
    findMandatoryDocumentTypesForStatistics(),
    findEmployeeDocumentTypeIds(employeeId),
  ]);
  const mandatoryDocumentCompleteness = calculateMandatoryDocumentCompleteness({
    employee,
    documentTypes: mandatoryDocumentTypes,
    documents: employeeDocumentTypeIds,
  });

  const pendingCount = await countEmployeeDocumentsByStatus({ employeeId, status: "PENDING" });
  const approvedCount = await countEmployeeDocumentsByStatus({ employeeId, status: "APPROVED" });
  const rejectedCount = await countEmployeeDocumentsByStatus({ employeeId, status: "REJECTED" });
  const expiredCount = await countEmployeeDocumentsByStatus({ employeeId, status: "EXPIRED" });

  const totalSubmitted = await countEmployeeDocumentsByStatus({ employeeId });

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringDocuments = await findExpiringEmployeeDocuments({
    employeeId,
    now,
    until: thirtyDaysFromNow,
  });

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
    mandatoryDocumentCompleted: mandatoryDocumentCompleteness.completed,
    mandatoryDocumentTotal: mandatoryDocumentCompleteness.total,
  };
}
