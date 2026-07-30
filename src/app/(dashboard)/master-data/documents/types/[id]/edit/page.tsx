import { notFound } from "next/navigation";

import { DocumentTypeFormPage } from "@/modules/document/components/DocumentTypeFormPage";
import { PAGINATION } from "@/constants";
import { requireDashboardRole } from "@/lib/dashboard-auth";
import { AppError } from "@/lib/errors";
import { getDocumentTypeForAdminEdit } from "@/modules/document/server";
import { getMasterDataList } from "@/modules/employee/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDocumentTypePage({ params }: PageProps) {
  await requireDashboardRole("ADMIN");

  const { id } = await params;

  const [documentType, employmentStatuses, employeeGroups, professionGroups, employeePositions, employeeRanks, workplaces] = await Promise.all([
    getDocumentTypeForAdminEdit(id).catch((error) => {
      if (error instanceof AppError && error.status === 404) {
        notFound();
      }
      throw error;
    }),
    getMasterDataList("EmploymentStatus", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("EmployeeGroup", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("ProfessionGroup", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("EmployeePosition", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("EmployeeRank", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("Workplace", { limit: PAGINATION.masterDataEntityLimit }),
  ]);

  return (
    <DocumentTypeFormPage
      mode="edit"
      documentTypeId={id}
      initialData={documentType}
      employmentStatuses={employmentStatuses.data}
      employeeGroups={employeeGroups.data}
      professionGroups={professionGroups.data}
      employeePositions={employeePositions.data}
      employeeRanks={employeeRanks.data}
      workplaces={workplaces.data}
    />
  );
}
