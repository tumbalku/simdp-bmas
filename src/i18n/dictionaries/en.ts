import type { Dictionary } from "../types";

export const en = {
  app: {
    name: "SIMDP",
    organization: "RSUD Bahteramas",
  },
  nav: {
    dashboard: "Dashboard",
    documents: "Documents",
    verification: "Verification",
    masterData: "Master Data",
    masterDataDocuments: "Documents",
    masterDataEmployees: "Employees",
    masterDataCategories: "Categories",
    security: "Security",
    settings: "Settings",
    menu: "Menu",
  },
  masterData: {
    categories: {
      pageTitle: "Employee Categories",
      pageDescription:
        "Manage employment status hierarchy, employee groups, profession groups, positions, ranks, and workplaces.",
      addMaster: "Add Master",
      statusAndGroup: "Status & Employee Groups",
      professionAndPosition: "Profession Groups & Positions",
      rankAndGrade: "Ranks & Grades",
      workplace: "Workplace",
      emptyEmploymentStatus: "No employment status data yet.",
      emptyEmployeeGroup: "No groups for this status yet.",
      emptyProfessionGroup: "No profession group data yet.",
      emptyEmployeePosition: "No positions for this group yet.",
      emptyRank: "No rank or grade data yet.",
      emptyWorkplace: "No workplace data yet.",
      typeLabel: "Category Type",
      typePlaceholder: "Choose category type",
      createDescription: "Fill in the new category data.",
      editDescription: "Update the selected category data.",
      saveCreateSuccess: "Data added successfully.",
      saveUpdateSuccess: "Data updated successfully.",
    },
  },
} as const satisfies Dictionary;
