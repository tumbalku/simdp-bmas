import { requireAuth } from "@/lib/auth";
import { getMasterDataList } from "@/modules/employee/service";
import {
  MasterDataCategoriesView,
  type CategoryMasterData,
} from "@/modules/employee/components/MasterDataCategoriesView";

export const dynamic = "force-dynamic";

const ENTITY_LIMIT = 200;

type MasterDataRecord = {
  id: string;
  name: string;
};

type RelatedMasterDataRecord = MasterDataRecord & {
  employmentStatus?: MasterDataRecord | null;
  professionGroup?: MasterDataRecord | null;
};

function toMasterData(data: unknown): CategoryMasterData[] {
  return Array.isArray(data)
    ? (data as MasterDataRecord[]).map((item) => ({
        id: item.id,
        name: item.name,
      }))
    : [];
}

function toRelatedMasterData(
  data: unknown,
  relationName: "employmentStatus" | "professionGroup"
): CategoryMasterData[] {
  return Array.isArray(data)
    ? (data as RelatedMasterDataRecord[]).map((item) => ({
        id: item.id,
        name: item.name,
        parentId: item[relationName]?.id ?? null,
      }))
    : [];
}

export default async function MasterDataCategoriesPage() {
  await requireAuth("ADMIN");

  const [
    employmentStatuses,
    employeeGroups,
    professionGroups,
    employeePositions,
    employeeRanks,
    workplaces,
  ] = await Promise.all([
    getMasterDataList("EmploymentStatus", { limit: ENTITY_LIMIT }),
    getMasterDataList("EmployeeGroup", { limit: ENTITY_LIMIT }),
    getMasterDataList("ProfessionGroup", { limit: ENTITY_LIMIT }),
    getMasterDataList("EmployeePosition", { limit: ENTITY_LIMIT }),
    getMasterDataList("EmployeeRank", { limit: ENTITY_LIMIT }),
    getMasterDataList("Workplace", { limit: ENTITY_LIMIT }),
  ]);

  return (
    <MasterDataCategoriesView
      initialData={{
        employmentStatuses: toMasterData(employmentStatuses.data),
        employeeGroups: toRelatedMasterData(
          employeeGroups.data,
          "employmentStatus"
        ),
        professionGroups: toMasterData(professionGroups.data),
        employeePositions: toRelatedMasterData(
          employeePositions.data,
          "professionGroup"
        ),
        employeeRanks: toMasterData(employeeRanks.data),
        workplaces: toMasterData(workplaces.data),
      }}
    />
  );
}
