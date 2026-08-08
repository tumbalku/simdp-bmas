import { requireDashboardRole } from "@/lib/dashboard-auth";
import { getMasterDataList } from "@/modules/employee/server";
import { EmployeeImportView } from "@/modules/employee/components/EmployeeImportView";

export const dynamic = "force-dynamic";

export default async function ImportsEmployeePage() {
  await requireDashboardRole("ADMIN");

  // Load all reference data for select dropdowns
  const [employmentStatuses, employeeGroups, professionGroups, employeePositions, employeeRanks, workplaces] =
    await Promise.all([
      getMasterDataList("EmploymentStatus", { limit: 200 }),
      getMasterDataList("EmployeeGroup", { limit: 200 }),
      getMasterDataList("ProfessionGroup", { limit: 200 }),
      getMasterDataList("EmployeePosition", { limit: 200 }),
      getMasterDataList("EmployeeRank", { limit: 200 }),
      getMasterDataList("Workplace", { limit: 200 }),
    ]);

  return (
    <EmployeeImportView
      employmentStatuses={employmentStatuses.data}
      employeeGroups={employeeGroups.data}
      professionGroups={professionGroups.data}
      employeePositions={employeePositions.data}
      employeeRanks={employeeRanks.data}
      workplaces={workplaces.data}
    />
  );
}
