import { PAGINATION } from "@/constants";
import { requireAuth } from "@/lib/auth";
import { DocumentTypeFormPage } from "@/components/shared/DocumentTypeFormPage";
import { getMasterDataList } from "@/modules/employee/server";

export const dynamic = "force-dynamic";

export default async function AddDocumentTypePage() {
  await requireAuth("ADMIN");

  const [employmentStatuses, employeeGroups, professionGroups, employeePositions, employeeRanks, workplaces] = await Promise.all([
    getMasterDataList("EmploymentStatus", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("EmployeeGroup", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("ProfessionGroup", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("EmployeePosition", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("EmployeeRank", { limit: PAGINATION.masterDataEntityLimit }),
    getMasterDataList("Workplace", { limit: PAGINATION.masterDataEntityLimit }),
  ]);

  return (
    <DocumentTypeFormPage
      employmentStatuses={employmentStatuses.data}
      employeeGroups={employeeGroups.data}
      professionGroups={professionGroups.data}
      employeePositions={employeePositions.data}
      employeeRanks={employeeRanks.data}
      workplaces={workplaces.data}
    />
  );
}
