import { notFound } from "next/navigation";
import { requireDashboardRole } from "@/lib/dashboard-auth";
import { EmployeeDetailView } from "@/modules/employee/components/EmployeeDetailView";
import { getEmployeeDetail, getMasterDataList } from "@/modules/employee/server";

export const dynamic = "force-dynamic";

type MasterDataRecord = {
  id: string;
  name: string;
  employmentStatusId?: string;
  professionGroupId?: string;
  employmentStatus?: { id: string } | null;
  professionGroup?: { id: string } | null;
};

async function getMasterData(entityType: Parameters<typeof getMasterDataList>[0]) {
  const result = await getMasterDataList(entityType, { limit: 1000 });

  return result.data as MasterDataRecord[];
}

export default async function MasterDataEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardRole("ADMIN");
  const employee = await getEmployeeDetail(id);

  if (!employee) {
    notFound();
  }

  const [employmentStatuses, employeeGroups, professionGroups, employeePositions, employeeRanks, workplaces] = await Promise.all([
    getMasterData("EmploymentStatus"),
    getMasterData("EmployeeGroup"),
    getMasterData("ProfessionGroup"),
    getMasterData("EmployeePosition"),
    getMasterData("EmployeeRank"),
    getMasterData("Workplace"),
  ]);

  return (
    <EmployeeDetailView
      employee={employee}
      masterData={{
        employmentStatuses,
        employeeGroups: employeeGroups.map((group) => ({
          ...group,
          employmentStatusId: group.employmentStatusId ?? group.employmentStatus?.id ?? "",
        })),
        professionGroups,
        employeePositions: employeePositions.map((position) => ({
          ...position,
          professionGroupId: position.professionGroupId ?? position.professionGroup?.id ?? "",
        })),
        employeeRanks,
        workplaces,
      }}
    />
  );
}
