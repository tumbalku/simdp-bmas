import { EMPLOYEE_CATEGORY_TYPE_CONFIG, type EmployeeCategoryType } from "@/modules/employee/constants";

export type CategoryMasterData = { id: string; name: string; parentId?: string | null; };
export type CategoryType = EmployeeCategoryType;
export type CategoriesData = {
  employmentStatuses: CategoryMasterData[];
  employeeGroups: CategoryMasterData[];
  professionGroups: CategoryMasterData[];
  employeePositions: CategoryMasterData[];
  employeeRanks: CategoryMasterData[];
  workplaces: CategoryMasterData[];
};
export type HierarchyItem = CategoryMasterData & { children: CategoryMasterData[] };

export function getTypeItems(data: CategoriesData, type: CategoryType) {
  switch (type) {
    case "STATUS": return data.employmentStatuses;
    case "GROUP": return data.employeeGroups;
    case "PROFESSION": return data.professionGroups;
    case "POSITION": return data.employeePositions;
    case "RANK": return data.employeeRanks;
    case "WORKPLACE": return data.workplaces;
  }
}
export function getParentOptions(data: CategoriesData, type: CategoryType) {
  const config = EMPLOYEE_CATEGORY_TYPE_CONFIG[type];
  const parentType = "parentType" in config ? config.parentType : undefined;
  return parentType ? getTypeItems(data, parentType) : [];
}
export function setTypeItems(data: CategoriesData, type: CategoryType, updater: (items: CategoryMasterData[]) => CategoryMasterData[]): CategoriesData {
  switch (type) {
    case "STATUS": return { ...data, employmentStatuses: updater(data.employmentStatuses) };
    case "GROUP": return { ...data, employeeGroups: updater(data.employeeGroups) };
    case "PROFESSION": return { ...data, professionGroups: updater(data.professionGroups) };
    case "POSITION": return { ...data, employeePositions: updater(data.employeePositions) };
    case "RANK": return { ...data, employeeRanks: updater(data.employeeRanks) };
    case "WORKPLACE": return { ...data, workplaces: updater(data.workplaces) };
  }
}
export function buildHierarchy(parents: CategoryMasterData[], children: CategoryMasterData[]): HierarchyItem[] {
  return parents.map((parent) => ({ ...parent, children: children.filter((child) => child.parentId === parent.id) }));
}
