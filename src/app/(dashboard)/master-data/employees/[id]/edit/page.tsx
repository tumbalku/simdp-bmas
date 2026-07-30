import { notFound } from "next/navigation";

import { requireDashboardRole } from "@/lib/dashboard-auth";
import { MasterDataEmployeeForm } from "@/modules/employee/components/MasterDataEmployeeForm";
import { getEmployeeDetail, getMasterDataList } from "@/modules/employee/server";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardRole("ADMIN");
  const { id } = await params;

  const [employee, employmentStatuses, employeeGroups, professionGroups, employeePositions, employeeRanks, workplaces] =
    await Promise.all([
      getEmployeeDetail(id),
      getMasterDataList("EmploymentStatus", { limit: 200 }),
      getMasterDataList("EmployeeGroup", { limit: 200 }),
      getMasterDataList("ProfessionGroup", { limit: 200 }),
      getMasterDataList("EmployeePosition", { limit: 200 }),
      getMasterDataList("EmployeeRank", { limit: 200 }),
      getMasterDataList("Workplace", { limit: 200 }),
    ]);

  if (!employee) notFound();

  return (
    <MasterDataEmployeeForm
      initialData={employee}
      employmentStatuses={employmentStatuses.data}
      employeeGroups={employeeGroups.data}
      professionGroups={professionGroups.data}
      employeePositions={employeePositions.data}
      employeeRanks={employeeRanks.data}
      workplaces={workplaces.data}
    />
  );
}
