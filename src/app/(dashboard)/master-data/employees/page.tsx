import { requireDashboardRole } from "@/lib/dashboard-auth";
import { PAGINATION } from "@/constants";
import { getEmployeeDirectoryWithPagination, getEmployeeDirectorOptions, getMasterDataList } from "@/modules/employee/server";
import { MasterDataEmployeesView } from "@/modules/employee/components/MasterDataEmployeesView";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    employmentStatusId?: string;
    employeeGroupId?: string;
    professionGroupId?: string;
    employeePositionId?: string;
    employeeRankId?: string;
    rankName?: string;
    grade?: string;
    workplaceId?: string;
    maritalStatus?: string;
    lastEducation?: string;
    tmtStartDate?: string;
    tmtEndDate?: string;
    retirementAgeFrom?: string;
    retirementAgeTo?: string;
    status?: string;
    archiveView?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

function parsePositiveInt(value: string | undefined, fallback?: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function MasterDataEmployeesPage({ searchParams }: PageProps) {
  await requireDashboardRole("ADMIN");

  const params = await searchParams;
  const page = parsePositiveInt(params.page, PAGINATION.defaultPage);
  const limit = parsePositiveInt(params.limit, PAGINATION.defaultPageSize);

  const [
    employeeDirectory,
    employmentStatuses,
    employeeGroups,
    professionGroups,
    employeePositions,
    employeeRanks,
    workplaces,
    directorOptions,
  ] = await Promise.all([
      getEmployeeDirectoryWithPagination({
        archiveView: params.archiveView === "archived" ? "archived" : "active",
        page,
        limit,
        search: params.search,
        employmentStatusId: params.employmentStatusId,
        employeeGroupId: params.employeeGroupId,
        professionGroupId: params.professionGroupId,
        employeePositionId: params.employeePositionId,
        employeeRankId: params.employeeRankId,
        rankName: params.rankName,
        grade: params.grade,
        workplaceId: params.workplaceId,
        maritalStatus: params.maritalStatus,
        lastEducation: params.lastEducation,
        tmtStartDate: params.tmtStartDate,
        tmtEndDate: params.tmtEndDate,
        retirementAgeFrom: parseNonNegativeInt(params.retirementAgeFrom),
        retirementAgeTo: parseNonNegativeInt(params.retirementAgeTo),
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder as "asc" | "desc" | undefined,
      }),
      getMasterDataList("EmploymentStatus", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("EmployeeGroup", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("ProfessionGroup", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("EmployeePosition", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("EmployeeRank", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("Workplace", { limit: PAGINATION.masterDataEntityLimit }),
      getEmployeeDirectorOptions(),
    ]);

  return (
    <MasterDataEmployeesView
      employees={employeeDirectory.data}
      pagination={employeeDirectory.pagination}
      archiveView={params.archiveView === "archived" ? "archived" : "active"}
      filterOptions={{
        employmentStatuses: employmentStatuses.data,
        employeeGroups: employeeGroups.data,
        professionGroups: professionGroups.data,
        employeePositions: employeePositions.data,
        employeeRanks: employeeRanks.data,
        workplaces: workplaces.data,
        rankNames: [
          ...new Set(
            (employeeRanks.data as { rankName?: string | null }[])
              .map((r) => r.rankName)
              .filter((v): v is string => typeof v === "string" && v.trim() !== "")
          ),
        ].sort(),
        grades: [
          ...new Set(
            (employeeRanks.data as { grade?: string | null }[])
              .map((r) => r.grade)
              .filter((v): v is string => typeof v === "string" && v.trim() !== "")
          ),
        ].sort(),
      }}
      directorOptions={directorOptions}
      sortBy={params.sortBy}
      sortOrder={params.sortOrder as "asc" | "desc" | undefined}
    />
  );
}
