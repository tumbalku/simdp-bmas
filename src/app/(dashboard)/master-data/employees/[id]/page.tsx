import { notFound, redirect } from "next/navigation";
import { getEmployeeDetailAction, getMasterDataListAction } from "@/modules/employee";
import { EmployeeDetailView } from "@/modules/employee/components/EmployeeDetailView";

export const dynamic = "force-dynamic";

type MasterDataRecord = {
  id: string;
  name: string;
  employmentStatusId?: string;
  professionGroupId?: string;
  employmentStatus?: { id: string } | null;
  professionGroup?: { id: string } | null;
};

async function getMasterData(entityType: Parameters<typeof getMasterDataListAction>[0]) {
  const result = await getMasterDataListAction(entityType, { limit: 1000 });

  if (!result.ok) {
    return [] as MasterDataRecord[];
  }

  return result.data.data as MasterDataRecord[];
}

export default async function MasterDataEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEmployeeDetailAction(id);

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }
    redirect(result.error.code === "FORBIDDEN" ? "/dashboard" : "/login");
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
      employee={result.data}
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
