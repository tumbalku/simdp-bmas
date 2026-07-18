import { requireAuth } from "@/lib/auth";
import { PAGINATION } from "@/constants";
import { getEmployeeDirectoryWithPaginationAction } from "@/modules/employee";
import { getMasterDataList } from "@/modules/employee/server";
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
    workplaceId?: string;
    maritalStatus?: string;
    lastEducation?: string;
    tmtStartDate?: string;
    tmtEndDate?: string;
    retirementAgeFrom?: string;
    retirementAgeTo?: string;
    status?: string;
    archiveView?: string;
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
  await requireAuth("ADMIN");

  const params = await searchParams;
  const page = parsePositiveInt(params.page, PAGINATION.defaultPage);
  const limit = parsePositiveInt(params.limit, PAGINATION.defaultPageSize);

  const [result, employmentStatuses, employeeGroups, professionGroups, employeePositions, employeeRanks, workplaces] =
    await Promise.all([
      getEmployeeDirectoryWithPaginationAction({
        archiveView: params.archiveView === "archived" ? "archived" : "active",
        page,
        limit,
        search: params.search,
        employmentStatusId: params.employmentStatusId,
        employeeGroupId: params.employeeGroupId,
        professionGroupId: params.professionGroupId,
        employeePositionId: params.employeePositionId,
        employeeRankId: params.employeeRankId,
        workplaceId: params.workplaceId,
        maritalStatus: params.maritalStatus,
        lastEducation: params.lastEducation,
        tmtStartDate: params.tmtStartDate,
        tmtEndDate: params.tmtEndDate,
        retirementAgeFrom: parseNonNegativeInt(params.retirementAgeFrom),
        retirementAgeTo: parseNonNegativeInt(params.retirementAgeTo),
        status: params.status,
      }),
      getMasterDataList("EmploymentStatus", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("EmployeeGroup", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("ProfessionGroup", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("EmployeePosition", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("EmployeeRank", { limit: PAGINATION.masterDataEntityLimit }),
      getMasterDataList("Workplace", { limit: PAGINATION.masterDataEntityLimit }),
    ]);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return (
    <MasterDataEmployeesView
      employees={result.data.data}
      pagination={result.data.pagination}
      archiveView={params.archiveView === "archived" ? "archived" : "active"}
      filterOptions={{
        employmentStatuses: employmentStatuses.data,
        employeeGroups: employeeGroups.data,
        professionGroups: professionGroups.data,
        employeePositions: employeePositions.data,
        employeeRanks: employeeRanks.data,
        workplaces: workplaces.data,
      }}
    />
  );
}
